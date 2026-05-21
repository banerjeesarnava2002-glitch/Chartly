import os
import json
import re
from openai import OpenAI
from typing import List, Dict, Any, Optional

# Module-level client cache
_client = None

def get_client():
    global _client
    if _client is None:
        api_key = os.getenv("DEEPSEEK_API_KEY")
        base_url = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
        if api_key:
            api_key = api_key.strip()
        if base_url:
            base_url = base_url.strip()
        if api_key and api_key != "your_deepseek_api_key_here":
            _client = OpenAI(api_key=api_key, base_url=base_url)
    return _client

class NLPService:
    @staticmethod
    def try_handle_dashboard_modification(query: str, columns: List[str], column_types: Dict[str, str], recent_context: Optional[Dict], dataset_sample: Optional[List[Dict]]) -> Optional[Dict]:
        if not recent_context or not recent_context.get("current_dashboard"):
            return None
            
        query_lower = query.lower()
        
        is_add = any(kw in query_lower for kw in ["add", "append", "insert", "put"])
        is_remove = any(kw in query_lower for kw in ["remove", "delete", "drop", "discard"])
        
        dashboard_keywords = ["dashboard", "chart", "charts", "plot", "plots", "tile", "tiles", "visual", "visuals", "summary", "table", "diagram", "diagrams"]
        has_dashboard_kw = any(kw in query_lower for kw in dashboard_keywords)
        
        if not (is_add or is_remove) or not has_dashboard_kw:
            return None
            
        current_db = recent_context["current_dashboard"]
        current_tiles = current_db.get("tiles", [])
        
        normalized_tiles = []
        for tile in current_tiles:
            normalized_tile = dict(tile)
            if "operation" not in normalized_tile:
                t_type = normalized_tile.get("type") or normalized_tile.get("chart_type")
                if t_type == "table":
                    normalized_tile["operation"] = "summary"
                elif t_type == "diagram":
                    normalized_tile["operation"] = "diagram"
                else:
                    normalized_tile["operation"] = "chart"
                    
            if normalized_tile["operation"] == "chart":
                if "type" not in normalized_tile:
                    normalized_tile["type"] = normalized_tile.get("chart_type") or "bar"
                if "chart_type" not in normalized_tile:
                    normalized_tile["chart_type"] = normalized_tile["type"]
            elif normalized_tile["operation"] == "diagram":
                normalized_tile["type"] = "diagram"
                if "diagram_type" not in normalized_tile:
                    normalized_tile["diagram_type"] = "flowchart"
            elif normalized_tile["operation"] == "summary":
                normalized_tile["type"] = "table"
                
            normalized_tiles.append(normalized_tile)
            
        if is_remove:
            tile_to_remove_idx = None
            
            # 1. Index-based matching
            index_map = {
                "first": 0, "1st": 0, "one": 0,
                "second": 1, "2nd": 1, "two": 1,
                "third": 2, "3rd": 2, "three": 2,
                "fourth": 3, "4th": 3, "four": 3,
                "fifth": 4, "5th": 4, "five": 4,
            }
            for word, idx in index_map.items():
                if re.search(r'\b' + re.escape(word) + r'\b', query_lower):
                    tile_to_remove_idx = idx
                    break
            
            # 2. Match by exact column name
            if tile_to_remove_idx is None:
                for col in columns:
                    normalized_col = col.lower().replace("_", " ")
                    if re.search(r'\b' + re.escape(col.lower()) + r'\b', query_lower) or \
                       re.search(r'\b' + re.escape(normalized_col) + r'\b', query_lower):
                        for t_idx, tile in enumerate(normalized_tiles):
                            if tile.get("x_col") == col or tile.get("y_col") == col:
                                tile_to_remove_idx = t_idx
                                break
                        if tile_to_remove_idx is not None:
                            break
                            
            # 3. Match by data value (column value search)
            if tile_to_remove_idx is None and dataset_sample:
                words = re.findall(r'\b\w+\b', query_lower)
                matched_column = None
                for word in words:
                    if len(word) < 3 or word in ["add", "remove", "delete", "drop", "discard", "chart", "charts", "dashboard", "visual", "visuals", "table", "summary", "pie", "bar", "line", "scatter"]:
                        continue
                    for row in dataset_sample:
                        for col, val in row.items():
                            if val is not None and str(val).lower() == word:
                                matched_column = col
                                break
                        if matched_column:
                            break
                    if matched_column:
                        break
                
                if matched_column:
                    for t_idx, tile in enumerate(normalized_tiles):
                        if tile.get("x_col") == matched_column or tile.get("y_col") == matched_column:
                            tile_to_remove_idx = t_idx
                            break

            # 4. Match by tile/chart type
            if tile_to_remove_idx is None:
                if "pie" in query_lower:
                    for t_idx, tile in enumerate(normalized_tiles):
                        if tile.get("chart_type") == "pie" or tile.get("type") == "pie":
                            tile_to_remove_idx = t_idx
                            break
                elif "line" in query_lower:
                    for t_idx, tile in enumerate(normalized_tiles):
                        if tile.get("chart_type") == "line" or tile.get("type") == "line":
                            tile_to_remove_idx = t_idx
                            break
                elif "bar" in query_lower:
                    for t_idx, tile in enumerate(normalized_tiles):
                        if tile.get("chart_type") == "bar" or tile.get("type") == "bar":
                            tile_to_remove_idx = t_idx
                            break
                elif "scatter" in query_lower:
                    for t_idx, tile in enumerate(normalized_tiles):
                        if tile.get("chart_type") == "scatter" or tile.get("type") == "scatter":
                            tile_to_remove_idx = t_idx
                            break
                elif any(w in query_lower for w in ["summary", "table"]):
                    for t_idx, tile in enumerate(normalized_tiles):
                        if tile.get("operation") == "summary" or tile.get("type") == "table":
                            tile_to_remove_idx = t_idx
                            break
                elif "diagram" in query_lower or "flowchart" in query_lower or "mindmap" in query_lower or "timeline" in query_lower or "venn" in query_lower:
                    for t_idx, tile in enumerate(normalized_tiles):
                        if tile.get("operation") == "diagram" or tile.get("type") == "diagram":
                            tile_to_remove_idx = t_idx
                            break
            
            # 5. Last tile check
            if tile_to_remove_idx is None and "last" in query_lower:
                tile_to_remove_idx = len(normalized_tiles) - 1
                
            if tile_to_remove_idx is not None and 0 <= tile_to_remove_idx < len(normalized_tiles):
                new_tiles = [t for i, t in enumerate(normalized_tiles) if i != tile_to_remove_idx]
                removed_tile = normalized_tiles[tile_to_remove_idx]
                if removed_tile.get("operation") == "chart":
                    removed_desc = f"Removed the {removed_tile.get('chart_type')} chart mapping {removed_tile.get('x_col')} vs {removed_tile.get('y_col')} from the dashboard."
                elif removed_tile.get("operation") == "diagram":
                    removed_desc = f"Removed the {removed_tile.get('diagram_type')} diagram from the dashboard."
                elif removed_tile.get("operation") == "summary":
                    removed_desc = f"Removed the summary table from the dashboard."
                else:
                    removed_desc = f"Removed visual at position {tile_to_remove_idx + 1} from dashboard."
                    
                return {
                    "operation": "dashboard",
                    "explanation": removed_desc,
                    "tiles": new_tiles
                }
                
        if is_add:
            session_visuals = recent_context.get("session_visuals", [])
            
            num_to_add = None
            if any(phrase in query_lower for phrase in ["last 2", "last two", "latest 2", "latest two"]):
                num_to_add = 2
            elif any(phrase in query_lower for phrase in ["last 3", "last three", "latest 3", "latest three"]):
                num_to_add = 3
            elif any(phrase in query_lower for phrase in ["last 4", "last four", "latest 4", "latest four"]):
                num_to_add = 4
            elif any(phrase in query_lower for phrase in ["last 5", "last five", "latest 5", "latest five"]):
                num_to_add = 5
            elif any(phrase in query_lower for phrase in ["last", "latest", "previous", "recent"]):
                num_to_add = 1
                
            if num_to_add is not None:
                if len(session_visuals) >= num_to_add:
                    visuals_to_add = session_visuals[-num_to_add:]
                else:
                    visuals_to_add = session_visuals
                    
                new_tiles = list(normalized_tiles)
                added_count = 0
                for vis in visuals_to_add:
                    vis_parsed = vis["parsed"]
                    new_tile = None
                    if vis_parsed.get("operation") == "chart":
                        new_tile = {
                            "operation": "chart",
                            "type": vis_parsed.get("type", "bar"),
                            "chart_type": vis_parsed.get("type", "bar"),
                            "x_col": vis_parsed.get("x_col"),
                            "y_col": vis_parsed.get("y_col"),
                        }
                    elif vis_parsed.get("operation") == "diagram":
                        new_tile = {
                            "operation": "diagram",
                            "type": "diagram",
                            "diagram_type": vis_parsed.get("diagram_type", "flowchart"),
                            "nodes": vis_parsed.get("nodes", []),
                            "edges": vis_parsed.get("edges", [])
                        }
                        
                    if new_tile:
                        is_dup = False
                        for existing in normalized_tiles:
                            if (existing.get("operation") == new_tile["operation"] and
                                    existing.get("x_col") == new_tile.get("x_col") and
                                    existing.get("y_col") == new_tile.get("y_col") and
                                    existing.get("type") == new_tile.get("type") and
                                    existing.get("diagram_type") == new_tile.get("diagram_type")):
                                is_dup = True
                                break
                        if not is_dup:
                            new_tiles.append(new_tile)
                            added_count += 1
                            
                return {
                    "operation": "dashboard",
                    "explanation": f"Appended the last {added_count} visual(s) to the dashboard.",
                    "tiles": new_tiles
                }
                
            sub_query = query_lower
            for kw in ["add a chart of", "add chart of", "add a", "add", "to dashboard", "to my dashboard", "in my dashboard", "in dashboard"]:
                sub_query = sub_query.replace(kw, "")
            sub_query = sub_query.strip()
            
            parsed_new = NLPService._fallback_parse(sub_query, columns, column_types, None)
            if parsed_new.get("operation") == "chart":
                new_tile = {
                    "operation": "chart",
                    "type": parsed_new.get("type", "bar"),
                    "chart_type": parsed_new.get("type", "bar"),
                    "x_col": parsed_new.get("x_col"),
                    "y_col": parsed_new.get("y_col"),
                }
                new_tiles = list(normalized_tiles)
                
                is_dup = False
                for existing in normalized_tiles:
                    if (existing.get("operation") == new_tile["operation"] and
                            existing.get("x_col") == new_tile.get("x_col") and
                            existing.get("y_col") == new_tile.get("y_col") and
                            existing.get("type") == new_tile.get("type")):
                        is_dup = True
                        break
                if not is_dup:
                    new_tiles.append(new_tile)
                return {
                    "operation": "dashboard",
                    "explanation": f"Added a new {new_tile['type']} chart of {new_tile['x_col']} vs {new_tile['y_col']} to the dashboard.",
                    "tiles": new_tiles
                }
                
        return None

    @staticmethod
    def parse_query(query: str, columns: List[str], column_types: Dict[str, str], dataset_sample: Optional[List[Dict]] = None, recent_context: Optional[Dict] = None) -> Dict:
        """
        Parses a natural language query using DeepSeek LLM.
        Now supports conversational Q&A in addition to charts and dashboards.
        Falls back to rule-based matching if API is not configured.
        """
        # Try to handle dashboard modifications programmatically first
        mod_result = NLPService.try_handle_dashboard_modification(query, columns, column_types, recent_context, dataset_sample)
        if mod_result:
            return mod_result

        client = get_client()
        
        if not client:
            return NLPService._fallback_parse(query, columns, column_types, recent_context)

        cols_with_types = ", ".join([f"{col} ({column_types.get(col, 'unknown')})" for col in columns])
        
        # Format sample data for AI context
        sample_str = ""
        if dataset_sample:
            sample_str = f"\n\nHere is a sample of the first rows of the dataset (for context):\n{json.dumps(dataset_sample[:5], indent=2)}"

        context_str = ""
        if recent_context:
            current_db = recent_context.get("current_dashboard")
            session_vis = recent_context.get("session_visuals", [])
            
            context_str += "\n\n=== CONVERSATION HISTORY & CONTEXT ==="
            if session_vis:
                context_str += "\nThe user has created the following charts/diagrams in this session so far:"
                for vis in session_vis:
                    parsed_op = vis["parsed"]
                    if parsed_op.get("operation") == "chart":
                        desc = f"Chart #{vis['index']}: {parsed_op.get('type')} chart mapping {parsed_op.get('x_col')} vs {parsed_op.get('y_col')}"
                    else:
                        desc = f"Diagram #{vis['index']}: {parsed_op.get('diagram_type')} diagram ({parsed_op.get('explanation')})"
                    context_str += f"\n- {desc} (User prompt: \"{vis['query']}\")"
                    
            if current_db:
                context_str += "\n\nThe current dashboard contains these tiles in this exact order:"
                tiles = current_db.get("tiles", [])
                for t_idx, tile in enumerate(tiles):
                    if tile.get("operation") == "chart":
                        context_str += f"\n- Tile #{t_idx + 1}: {tile.get('chart_type') or tile.get('type')} chart mapping {tile.get('x_col')} vs {tile.get('y_col')}"
                    elif tile.get("operation") == "diagram" or tile.get("type") == "diagram":
                        context_str += f"\n- Tile #{t_idx + 1}: {tile.get('diagram_type')} diagram"
                    else:
                        context_str += f"\n- Tile #{t_idx + 1}: {tile.get('operation') or tile.get('type')} summary"
            else:
                context_str += "\nNo active dashboard exists yet."
            context_str += "\n======================================"

        system_prompt = f"""
        You are a smart, friendly data analyst AI assistant embedded in a BI dashboard tool.
        The user has uploaded a dataset with the following columns and types: {cols_with_types}.{sample_str}{context_str}
        
        Your job is to respond to ANY question or command the user has about this dataset or visual concepts.
        
        Based on the user's query, return one of these operation types:
        
        1. "answer" — For conversational questions, factual queries, or calculations (unless they explicitly request a visual/chart).
           For this type, include a "message" field with a clear, helpful text answer. Use the column names and sample data to give a specific, accurate answer.
           
        2. "chart" — Whenever the user asks for a chart, graph, plot, comparison, or visual representation of data (e.g. "make a chart of payment method usage", "show me sales over time", "plot Category").
           If they do not specify the exact columns or chart type, you MUST analyze the dataset schema to choose the most logical and preferable chart:
           - "type": "bar" (best for categorical comparisons or general distributions), "line" (best for trends/time-series where X-axis is date/time/numeric index), "scatter" (best for showing correlation between two numeric variables), or "pie" (best for showing proportions of a categorical column with 2-6 distinct values).
           - "x_col": Column for X-axis.
           - "y_col": Column for Y-axis.
             * CRITICAL: If the user wants to count occurrences/distribution of a categorical column (e.g. "compare payment method usage"), set "x_col" to that categorical column, and set "y_col" to "count".
             * For bar/line/scatter, if "y_col" is not "count", it MUST be a numeric column from the dataset.
           - "explanation": Brief description of what the chart shows and why this visualization is the best fit.
           
        3. "dashboard" — Only when the user explicitly asks for a dashboard, report, overview, or asks to modify/update/add/remove charts from the dashboard.
           Requires a "tiles" array where each tile has: "operation" ("chart" or "summary"), plus:
           * For chart tiles: "type" (bar|line|scatter|pie), "x_col", "y_col", "explanation".
           * For diagram tiles: "type": "diagram", "diagram_type", "nodes", "edges".
           Ensure you apply the same smart "preferable chart" rules (like "y_col": "count" for categorical distributions) to dashboard chart tiles.
           Include "explanation" with a summary of the dashboard.
           
        4. "summary" — Only when the user asks for statistics, describe, or a data summary table.

        5. "diagram" — When the user asks for a flowchart, mind map, timeline, Venn diagram, process map, or workflow.

        CRITICAL RULES:
        - Be proactive. If the user asks for a chart, do not fail. Determine the best columns and parameters and return the chart.
        - For categorical distributions, ALWAYS set y_col to "count". Never put text columns on the Y-axis.
        
        CONTEXT & STATE PRESERVATION RULES (CRITICAL):
        - If a dashboard already exists (see the "current_dashboard" context), and the user wants to add/append new charts or diagrams (e.g., "add last 2 charts to dashboard", "add a chart of status to my dashboard"):
          You MUST preserve all existing tiles from "current_dashboard" and append the new ones. Do NOT discard, modify, or remove any existing tiles unless the user explicitly requests to remove them.
          Include all existing tiles' properties in their original order in the returned "tiles" array.
        - If the user wants to remove or delete a specific visual from the dashboard (e.g., "remove the second chart", "remove the UPI chart", "remove the summary table"):
          Locate that tile in "current_dashboard", remove ONLY that matching tile, and return a "dashboard" operation containing all of the remaining tiles in their original order.
        - If the user says "add last 2 charts", find the last two visuals in the "session_visuals" list, convert them into tiles (preserving their type, x_col, y_col or diagram nodes/edges), and append them to the existing dashboard tiles.
        
        Return ONLY a valid JSON object with no markdown:
        {{
            "operation": "answer" | "chart" | "dashboard" | "summary" | "diagram",
            "diagram_type": "flowchart" | "mindmap" | "timeline" | "venn" | "process" (only for diagram),
            "nodes": [...] (only for diagram),
            "edges": [...] (only for diagram),
            "message": "Your conversational text answer here" (required for 'answer'),
            "explanation": "..." (for chart/dashboard/summary/diagram),
            "type": "bar|line|scatter|pie" (only for chart),
            "x_col": "..." (only for chart),
            "y_col": "..." (only for chart),
            "tiles": [...] (only for dashboard)
        }}
        """

        try:
            response = client.chat.completions.create(
                model="deepseek-chat",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": query}
                ],
                response_format={"type": "json_object"}
            )
            content = response.choices[0].message.content
            return json.loads(content)
        except Exception as e:
            print(f"DeepSeek API error: {e}")
            return NLPService._fallback_parse(query, columns, column_types, recent_context)

    @staticmethod
    def _fallback_parse(query: str, columns: List[str], column_types: Dict[str, str], recent_context: Optional[Dict] = None) -> Dict:
        """
        Simple rule-based NLP matcher for when the LLM is unavailable.
        Uses heuristics to dynamically select the preferable chart type, X/Y axes, and count aggregations.
        Also handles appending and removing dashboard tiles.
        """
        query_lower = query.lower()
        
        def is_numeric(col: str) -> bool:
            col_type = column_types.get(col, "object").lower()
            return any(t in col_type for t in ["int", "float", "double", "num"]) or col.lower() in ["sales", "profit", "amount", "total", "price"]

        # Check for dashboard modification commands if we have a current dashboard context
        if recent_context and recent_context.get("current_dashboard"):
            current_db = recent_context["current_dashboard"]
            current_tiles = current_db.get("tiles", [])
            
            # Map dashboard tiles to standard dashboard format
            normalized_tiles = []
            for tile in current_tiles:
                # Keep original fields intact
                normalized_tile = dict(tile)
                # Map frontend 'chart_type' to 'type' or vice-versa to be safe
                if "chart_type" in tile and "type" not in tile:
                    normalized_tile["type"] = tile["chart_type"]
                if "type" in tile and "chart_type" not in tile:
                    normalized_tile["chart_type"] = tile["type"]
                normalized_tiles.append(normalized_tile)
            
            # 1. REMOVE TILE COMMAND
            if any(kw in query_lower for kw in ["remove", "delete", "drop", "discard"]):
                tile_to_remove_idx = None
                
                # Check for index-based removal word
                index_map = {
                    "first": 0, "1st": 0, "one": 0,
                    "second": 1, "2nd": 1, "two": 1,
                    "third": 2, "3rd": 2, "three": 2,
                    "fourth": 3, "4th": 3, "four": 3,
                    "fifth": 4, "5th": 4, "five": 4,
                }
                for word, idx in index_map.items():
                    if word in query_lower:
                        tile_to_remove_idx = idx
                        break
                        
                # Check if query mentions a column to remove that chart
                if tile_to_remove_idx is None:
                    for col in columns:
                        if col.lower() in query_lower or col.lower().replace("_", " ") in query_lower:
                            for t_idx, tile in enumerate(normalized_tiles):
                                if tile.get("x_col") == col or tile.get("y_col") == col:
                                    tile_to_remove_idx = t_idx
                                    break
                            if tile_to_remove_idx is not None:
                                break
                                
                if tile_to_remove_idx is None and any(w in query_lower for w in ["summary", "table"]):
                    for t_idx, tile in enumerate(normalized_tiles):
                        if tile.get("operation") == "summary" or tile.get("type") == "table":
                            tile_to_remove_idx = t_idx
                            break
                            
                if tile_to_remove_idx is None and "last" in query_lower:
                    tile_to_remove_idx = len(normalized_tiles) - 1
                    
                if tile_to_remove_idx is not None and 0 <= tile_to_remove_idx < len(normalized_tiles):
                    new_tiles = [t for i, t in enumerate(normalized_tiles) if i != tile_to_remove_idx]
                    return {
                        "operation": "dashboard",
                        "explanation": f"Removed visual at position {tile_to_remove_idx + 1} from dashboard.",
                        "tiles": new_tiles
                    }

            # 2. ADD/APPEND TILE COMMAND
            elif any(kw in query_lower for kw in ["add", "append", "insert"]):
                # Add last 2 charts/visuals
                if any(phrase in query_lower for phrase in ["last 2", "last two", "latest 2", "latest two"]):
                    session_visuals = recent_context.get("session_visuals", [])
                    if len(session_visuals) >= 2:
                        last_two = session_visuals[-2:]
                    else:
                        last_two = session_visuals
                        
                    new_tiles = list(normalized_tiles)
                    added_count = 0
                    for vis in last_two:
                        vis_parsed = vis["parsed"]
                        new_tile = None
                        if vis_parsed.get("operation") == "chart":
                            new_tile = {
                                "operation": "chart",
                                "type": vis_parsed.get("type", "bar"),
                                "chart_type": vis_parsed.get("type", "bar"),
                                "x_col": vis_parsed.get("x_col"),
                                "y_col": vis_parsed.get("y_col"),
                            }
                        elif vis_parsed.get("operation") == "diagram":
                            new_tile = {
                                "operation": "diagram",
                                "type": "diagram",
                                "diagram_type": vis_parsed.get("diagram_type", "flowchart"),
                                "nodes": vis_parsed.get("nodes", []),
                                "edges": vis_parsed.get("edges", [])
                            }
                            
                        if new_tile:
                            # Avoid adding duplicates
                            is_dup = False
                            for existing in normalized_tiles:
                                if (existing.get("operation") == new_tile["operation"] and
                                        existing.get("x_col") == new_tile.get("x_col") and
                                        existing.get("y_col") == new_tile.get("y_col") and
                                        existing.get("type") == new_tile.get("type") and
                                        existing.get("diagram_type") == new_tile.get("diagram_type")):
                                    is_dup = True
                                    break
                            if not is_dup:
                                new_tiles.append(new_tile)
                                added_count += 1
                                
                    return {
                        "operation": "dashboard",
                        "explanation": f"Appended the last {added_count} visual(s) to the dashboard.",
                        "tiles": new_tiles
                    }
                    
                # Add single last/latest visual
                elif any(phrase in query_lower for phrase in ["last", "latest", "previous", "recent"]):
                    session_visuals = recent_context.get("session_visuals", [])
                    new_tiles = list(normalized_tiles)
                    if session_visuals:
                        last_vis = session_visuals[-1]["parsed"]
                        new_tile = None
                        if last_vis.get("operation") == "chart":
                            new_tile = {
                                "operation": "chart",
                                "type": last_vis.get("type", "bar"),
                                "chart_type": last_vis.get("type", "bar"),
                                "x_col": last_vis.get("x_col"),
                                "y_col": last_vis.get("y_col"),
                            }
                        elif last_vis.get("operation") == "diagram":
                            new_tile = {
                                "operation": "diagram",
                                "type": "diagram",
                                "diagram_type": last_vis.get("diagram_type", "flowchart"),
                                "nodes": last_vis.get("nodes", []),
                                "edges": last_vis.get("edges", [])
                            }
                            
                        if new_tile:
                            is_dup = False
                            for existing in normalized_tiles:
                                if (existing.get("operation") == new_tile["operation"] and
                                        existing.get("x_col") == new_tile.get("x_col") and
                                        existing.get("y_col") == new_tile.get("y_col") and
                                        existing.get("type") == new_tile.get("type") and
                                        existing.get("diagram_type") == new_tile.get("diagram_type")):
                                    is_dup = True
                                    break
                            if not is_dup:
                                new_tiles.append(new_tile)
                                
                    return {
                        "operation": "dashboard",
                        "explanation": "Appended the latest visual to the dashboard.",
                        "tiles": new_tiles
                    }
                    
                # Otherwise, parse a new chart from query and append it
                else:
                    sub_query = query_lower.replace("add", "").replace("to dashboard", "").replace("to my dashboard", "").strip()
                    parsed_new = NLPService._fallback_parse(sub_query, columns, column_types, None)
                    if parsed_new.get("operation") == "chart":
                        new_tile = {
                            "operation": "chart",
                            "type": parsed_new.get("type", "bar"),
                            "chart_type": parsed_new.get("type", "bar"),
                            "x_col": parsed_new.get("x_col"),
                            "y_col": parsed_new.get("y_col"),
                        }
                        new_tiles = list(normalized_tiles)
                        new_tiles.append(new_tile)
                        return {
                            "operation": "dashboard",
                            "explanation": f"Added a new {new_tile['type']} chart of {new_tile['x_col']} vs {new_tile['y_col']} to the dashboard.",
                            "tiles": new_tiles
                        }

        if any(kw in query_lower for kw in ["summary", "describe", "stats", "statistics"]):
            return {"operation": "summary", "explanation": "Statistical summary of your dataset."}
            
        if any(kw in query_lower for kw in ["dashboard", "report", "overview"]):
            # Generate a default dashboard with a summary and a logical chart
            cat_col = None
            date_col = None
            num_col = None
            for col in columns:
                if "date" in col.lower() or "time" in col.lower():
                    date_col = col
                elif is_numeric(col) and col.lower() not in ["id", "index", "customer_id", "order_id"]:
                    num_col = col
                elif not is_numeric(col) and not cat_col:
                    cat_col = col
                    
            x_col = date_col or cat_col or columns[0]
            y_col = num_col or "count"
            chart_type = "line" if date_col and num_col else "bar"
            
            return {
                "operation": "dashboard",
                "explanation": f"Overview dashboard representing key metrics, showing a {chart_type} chart of {y_col} by {x_col}.",
                "tiles": [
                    {
                        "operation": "chart",
                        "type": chart_type,
                        "x_col": x_col,
                        "y_col": y_col,
                        "explanation": f"Visual trend/distribution of {y_col} across {x_col}."
                    },
                    {"operation": "summary"}
                ]
            }
            
        if any(kw in query_lower for kw in ["plot", "chart", "graph", "visualize", "show me", "compare"]):
            # Extract any columns mentioned in the query
            found_cols = []
            for col in columns:
                normalized_col = col.lower().replace("_", " ")
                if col.lower() in query_lower or normalized_col in query_lower:
                    found_cols.append(col)
            
            # Preferable chart type based on query keywords
            chart_type = "bar"
            if "pie" in query_lower:
                chart_type = "pie"
            elif "line" in query_lower:
                chart_type = "line"
            elif "scatter" in query_lower:
                chart_type = "scatter"
                
            if len(found_cols) >= 2:
                col1, col2 = found_cols[0], found_cols[1]
                # If first is numeric and second is categorical, flip them so X is categorical
                if is_numeric(col1) and not is_numeric(col2):
                    x_col, y_col = col2, col1
                else:
                    x_col, y_col = col1, col2
                    
                # Default to scatter if both are numeric and no type specified
                if is_numeric(col1) and is_numeric(col2) and not any(t in query_lower for t in ["line", "bar", "pie"]):
                    chart_type = "scatter"
                    
                return {
                    "operation": "chart",
                    "type": chart_type,
                    "x_col": x_col,
                    "y_col": y_col,
                    "explanation": f"Comparing {y_col} across {x_col} using a {chart_type} chart."
                }
            elif len(found_cols) == 1:
                col = found_cols[0]
                if is_numeric(col):
                    # Numeric column: search for a categorical/date column to group by
                    cat_cols = [c for c in columns if not is_numeric(c)]
                    date_cols = [c for c in columns if "date" in c.lower() or "time" in c.lower()]
                    
                    x_col = date_cols[0] if date_cols else (cat_cols[0] if cat_cols else columns[0])
                    y_col = col
                    type_choice = "line" if date_cols else "bar"
                    return {
                        "operation": "chart",
                        "type": type_choice,
                        "x_col": x_col,
                        "y_col": y_col,
                        "explanation": f"Visualizing {y_col} grouped by {x_col}."
                    }
                else:
                    # Categorical column: plot record counts (frequency)
                    return {
                        "operation": "chart",
                        "type": "pie" if "pie" in query_lower or "proportion" in query_lower or "share" in query_lower else "bar",
                        "x_col": col,
                        "y_col": "count",
                        "explanation": f"Distribution/usage count of {col}."
                    }
            else:
                # No columns mentioned: proactively choose logical columns based on dataset schema
                cat_col = None
                date_col = None
                num_col = None
                
                # Check for common naming patterns related to user interest
                for col in columns:
                    if "payment" in col.lower() or "method" in col.lower():
                        cat_col = col
                        break
                        
                if not cat_col:
                    for col in columns:
                        if "status" in col.lower() or "category" in col.lower() or "region" in col.lower():
                            cat_col = col
                            break
                            
                if not cat_col:
                    for col in columns:
                        if "date" in col.lower() or "time" in col.lower():
                            date_col = col
                        elif is_numeric(col) and col.lower() not in ["id", "index", "customer_id", "order_id"]:
                            num_col = col
                        elif not is_numeric(col) and not cat_col:
                            cat_col = col
                            
                if cat_col:
                    return {
                        "operation": "chart",
                        "type": "bar",
                        "x_col": cat_col,
                        "y_col": "count",
                        "explanation": f"Proactively selected a bar chart to compare frequency counts of {cat_col}."
                    }
                elif date_col and num_col:
                    return {
                        "operation": "chart",
                        "type": "line",
                        "x_col": date_col,
                        "y_col": num_col,
                        "explanation": f"Proactively selected a line chart showing {num_col} over {date_col}."
                    }
                elif num_col:
                    return {
                        "operation": "chart",
                        "type": "line",
                        "x_col": columns[0],
                        "y_col": num_col,
                        "explanation": f"Proactively selected a line chart of {num_col}."
                    }
                else:
                    return {
                        "operation": "chart",
                        "type": "bar",
                        "x_col": columns[0],
                        "y_col": "count",
                        "explanation": f"Proactively selected a bar chart showing frequencies of {columns[0]}."
                    }
        
        # Diagram fallback matching
        if any(kw in query_lower for kw in ["diagram", "flowchart", "mindmap", "mind map", "timeline", "venn", "process"]):
            diagram_type = "flowchart"
            if "mindmap" in query_lower or "mind map" in query_lower:
                diagram_type = "mindmap"
            elif "timeline" in query_lower:
                diagram_type = "timeline"
            elif "venn" in query_lower:
                diagram_type = "venn"
            elif "process" in query_lower:
                diagram_type = "process"
                
            # Construct dummy nodes representing dataset columns
            nodes = []
            edges = []
            
            if diagram_type == "mindmap":
                nodes.append({"id": "center", "label": "Dataset", "description": "Core schema", "color": "blue"})
                for idx, col in enumerate(columns[:5]):
                    node_id = f"col_{idx}"
                    nodes.append({"id": node_id, "label": col, "description": f"Column data type details", "color": "lavender"})
                    edges.append({"from": "center", "to": node_id})
            elif diagram_type == "venn":
                nodes = [
                    {"id": "v1", "label": columns[0] if len(columns) > 0 else "Set A", "description": "Primary segments", "color": "magenta"},
                    {"id": "v2", "label": columns[1] if len(columns) > 1 else "Set B", "description": "Secondary segments", "color": "orange"}
                ]
            else: # flowchart or process or timeline
                # linear pipeline
                nodes.append({"id": "start", "label": "Load Data", "description": "Import dataset", "color": "blue"})
                prev_id = "start"
                for idx, col in enumerate(columns[:4]):
                    node_id = f"col_{idx}"
                    nodes.append({"id": node_id, "label": f"Analyze {col}", "description": f"Process column: {col}", "color": "lavender"})
                    edges.append({"from": prev_id, "to": node_id, "label": "next"})
                    prev_id = node_id
                nodes.append({"id": "end", "label": "Export Dashboard", "description": "Generate reports", "color": "green"})
                edges.append({"from": prev_id, "to": "end", "label": "done"})
                
            return {
                "operation": "diagram",
                "diagram_type": diagram_type,
                "nodes": nodes,
                "edges": edges,
                "explanation": f"Generated {diagram_type} visualizing your dataset columns."
            }
        
        # Default: try to give a helpful text answer
        return {
            "operation": "answer",
            "message": f"Your dataset has {len(columns)} columns: {', '.join(columns)}. The AI API is not configured — please set up your DeepSeek API key for full conversational analysis. You can ask for a 'summary', a 'chart of X vs Y', a 'dashboard', or a 'diagram' (like a flowchart, mind map, or Venn diagram)."
        }

