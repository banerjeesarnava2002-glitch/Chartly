# Environment Variables

## General
| Name | Description | Example Value | Required |
|------|-------------|---------------|----------|
| `APP_NAME` | Application name | `dataset-playground` | Optional |
| `APP_ENV` | Environment (development, staging, production) | `development` | Required |
| `LOG_LEVEL` | Logging level | `INFO` | Optional |
| `SECRET_KEY` | Secret key for Flask/FastAPI sessions and CSRF | `your-secret-key-here` | Required |

## Backend (FastAPI)
| Name | Description | Example Value | Required |
|------|-------------|---------------|----------|
| `BACKEND_HOST` | Host address for the backend server | `0.0.0.0` | Optional |
| `BACKEND_PORT` | Port for the backend server | `8000` | Optional |
| `BACKEND_WORKERS` | Number of worker processes | `4` | Optional |
| `BACKEND_CORS_ORIGINS` | Comma-separated allowed CORS origins | `http://localhost:3000,https://app.example.com` | Required |
| `MAX_UPLOAD_SIZE_MB` | Maximum file upload size in megabytes | `100` | Optional |
| `ALLOWED_EXTENSIONS` | Comma-separated allowed file extensions | `csv,json,xlsx,xls,parquet` | Optional |
| `TEMP_FILE_DIR` | Directory for temporary uploaded files | `/tmp/dataset-playground` | Optional |
| `RESULTS_EXPIRY_HOURS` | Hours before processed results are deleted | `24` | Optional |

## Database (PostgreSQL)
| Name | Description | Example Value | Required |
|------|-------------|---------------|----------|
| `DATABASE_URL` | Full database connection URL | `postgresql://user:password@localhost:5432/dataset_playground` | Required |
| `DATABASE_HOST` | Database host | `localhost` | Required (if not using DATABASE_URL) |
| `DATABASE_PORT` | Database port | `5432` | Optional |
| `DATABASE_NAME` | Database name | `dataset_playground` | Required (if not using DATABASE_URL) |
| `DATABASE_USER` | Database user | `db_user` | Required (if not using DATABASE_URL) |
| `DATABASE_PASSWORD` | Database password | `db_password` | Required (if not using DATABASE_URL) |
| `DATABASE_POOL_SIZE` | Database connection pool size | `10` | Optional |
| `DATABASE_MAX_OVERFLOW` | Maximum overflow connections | `20` | Optional |
| `DATABASE_SSL_MODE` | SSL mode for database connection | `require` | Optional |

## Auth0
| Name | Description | Example Value | Required |
|------|-------------|---------------|----------|
| `AUTH0_DOMAIN` | Auth0 tenant domain | `your-tenant.auth0.com` | Required |
| `AUTH0_CLIENT_ID` | Auth0 application client ID | `abc123xyz` | Required |
| `AUTH0_CLIENT_SECRET` | Auth0 application client secret | `your-client-secret` | Required |
| `AUTH0_AUDIENCE` | Auth0 API audience identifier | `https://api.dataset-playground.com` | Required |
| `AUTH0_ALGORITHM` | JWT signing algorithm | `RS256` | Optional |
| `AUTH0_CALLBACK_URL` | Callback URL after login | `http://localhost:3000/callback` | Required |
| `AUTH0_LOGOUT_URL` | Logout redirect URL | `http://localhost:3000` | Optional |
| `AUTH0_SCOPE` | Requested scopes (space-separated) | `openid profile email` | Optional |

## Frontend (React)
| Name | Description | Example Value | Required |
|------|-------------|---------------|----------|
| `REACT_APP_API_URL` | Backend API base URL | `http://localhost:8000` | Required |
| `REACT_APP_AUTH0_DOMAIN` | Auth0 domain for frontend | `your-tenant.auth0.com` | Required |
| `REACT_APP_AUTH0_CLIENT_ID` | Auth0 client ID for frontend | `abc123xyz` | Required |
| `REACT_APP_AUTH0_AUDIENCE` | Auth0 audience for frontend | `https://api.dataset-playground.com` | Required |
| `REACT_APP_AUTH0_REDIRECT_URI` | Auth0 redirect URI for frontend | `http://localhost:3000/callback` | Required |
| `REACT_APP_AUTH0_LOGOUT_URI` | Auth0 logout redirect URI | `http://localhost:3000` | Optional |
| `REACT_APP_APP_NAME` | Application name displayed in UI | `Dataset Playground` | Optional |
| `REACT_APP_MAX_UPLOAD_SIZE_MB` | Max upload size shown in UI | `100` | Optional |

## Machine Learning
| Name | Description | Example Value | Required |
|------|-------------|---------------|----------|
| `ML_MODEL_DIR` | Directory to store trained ML models | `/app/models` | Optional |
| `ML_MAX_TRAINING_TIME` | Maximum training time in seconds | `300` | Optional |
| `ML_DEFAULT_TEST_SPLIT` | Default test split ratio | `0.2` | Optional |
| `ML_RANDOM_STATE` | Random seed for reproducibility | `42` | Optional |
| `ML_ENABLE_GPU` | Enable GPU acceleration if available | `false` | Optional |

## Redis (for caching and task queues)
| Name | Description | Example Value | Required |
|------|-------------|---------------|----------|
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379/0` | Optional |
| `REDIS_HOST` | Redis host | `localhost` | Optional |
| `REDIS_PORT` | Redis port | `6379` | Optional |
| `REDIS_PASSWORD` | Redis password | `redis_password` | Optional |
| `REDIS_DB` | Redis database number | `0` | Optional |

## Celery (for async tasks)
| Name | Description | Example Value | Required |
|------|-------------|---------------|----------|
| `CELERY_BROKER_URL` | Celery broker URL (use Redis or RabbitMQ) | `redis://localhost:6379/0` | Optional |
| `CELERY_RESULT_BACKEND` | Celery result backend URL | `redis://localhost:6379/0` | Optional |
| `CELERY_TASK_SERIALIZER` | Task serialization format | `json` | Optional |
| `CELERY_RESULT_SERIALIZER` | Result serialization format | `json` | Optional |
| `CELERY_ACCEPT_CONTENT` | Accepted content types | `json` | Optional |
| `CELERY_TASK_TRACK_STARTED` | Track task start time | `true` | Optional |
| `CELERY_TASK_TIME_LIMIT` | Maximum task run time in seconds | `3600` | Optional |

## Docker
| Name | Description | Example Value | Required |
|------|-------------|---------------|----------|
| `DOCKER_IMAGE_TAG` | Docker image tag for deployment | `latest` | Optional |
| `DOCKER_REGISTRY` | Docker registry URL | `your-registry.azurecr.io` | Optional |
| `DOCKER_BUILD_ARGS` | Build arguments for Docker image | `--build-arg APP_ENV=production` | Optional |

## AWS (for deployment)
| Name | Description | Example Value | Required |
|------|-------------|---------------|----------|
| `AWS_ACCESS_KEY_ID` | AWS access key ID | `AKIAIOSFODNN7EXAMPLE` | Required (for AWS deployment) |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` | Required (for AWS deployment) |
| `AWS_REGION` | AWS region | `us-east-1` | Required (for AWS deployment) |
| `AWS_ECS_CLUSTER` | ECS cluster name | `dataset-playground-cluster` | Optional |
| `AWS_ECS_SERVICE` | ECS service name | `dataset-playground-service` | Optional |
| `AWS_S3_BUCKET` | S3 bucket for file storage | `dataset-playground-files` | Optional |
| `AWS_S3_REGION` | S3 bucket region | `us-east-1` | Optional |
| `AWS_ELASTIC_BEANSTALK_ENV` | Elastic Beanstalk environment name | `dataset-playground-prod` | Optional |

## Monitoring & Logging
| Name | Description | Example Value | Required |
|------|-------------|---------------|----------|
| `SENTRY_DSN` | Sentry DSN for error tracking | `https://xxx@sentry.io/xxx` | Optional |
| `NEW_RELIC_LICENSE_KEY` | New Relic license key | `your-newrelic-key` | Optional |
| `NEW_RELIC_APP_NAME` | New Relic application name | `Dataset Playground` | Optional |
| `PROMETHEUS_MULTIPROC_DIR` | Directory for Prometheus multiprocess metrics | `/tmp/prometheus` | Optional |

## Security
| Name | Description | Example Value | Required |
|------|-------------|---------------|----------|
| `RATE_LIMIT_REQUESTS` | Maximum requests per minute per user | `60` | Optional |
| `RATE_LIMIT_WINDOW` | Rate limit time window in seconds | `60` | Optional |
| `ENCRYPTION_KEY` | Key for encrypting sensitive data at rest | `your-encryption-key` | Optional |
| `CONTENT_SECURITY_POLICY` | Content Security Policy header | `default-src 'self'` | Optional |
| `X_FRAME_OPTIONS` | X-Frame-Options header value | `DENY` | Optional |

## Email (for notifications)
| Name | Description | Example Value | Required |
|------|-------------|---------------|----------|
| `SMTP_HOST` | SMTP server host | `smtp.gmail.com` | Optional |
| `SMTP_PORT` | SMTP server port | `587` | Optional |
| `SMTP_USER` | SMTP username | `user@gmail.com` | Optional |
| `SMTP_PASSWORD` | SMTP password | `smtp-password` | Optional |
| `SMTP_USE_TLS` | Use TLS for SMTP | `true` | Optional |
| `EMAIL_FROM` | Default sender email address | `noreply@dataset-playground.com` | Optional |