import sys
import os

# Add app to path
sys.path.append(os.path.join(os.getcwd(), "app"))

from app.services.nlp_service import NLPService

def test_fallback():
    print("Testing Fallback Logic...")
    columns = ["Name", "Age", "Salary", "Department"]
    column_types = {"Name": "object", "Age": "int64", "Salary": "float64", "Department": "object"}
    
    # Test summary
    res = NLPService.parse_query("Give me a summary of the data", columns, column_types)
    print(f"Query: 'summary' -> Result: {res}")
    assert res["operation"] == "summary"
    
    # Test chart
    res = NLPService.parse_query("Plot Age vs Salary", columns, column_types)
    print(f"Query: 'plot Age vs Salary' -> Result: {res}")
    assert res["operation"] == "chart"
    assert res["x_col"] == "Age"
    assert res["y_col"] == "Salary"
    
    # Test unknown
    res = NLPService.parse_query("What is the meaning of life?", columns, column_types)
    print(f"Query: 'unknown' -> Result: {res}")
    assert res["operation"] == "answer"

if __name__ == "__main__":
    # Ensure env vars are NOT set for fallback test
    os.environ["DEEPSEEK_API_KEY"] = "your_deepseek_api_key_here"
    test_fallback()
    print("\nAll tests passed (Fallback logic verified)!")
