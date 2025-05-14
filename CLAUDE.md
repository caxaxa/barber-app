# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains the AWS SAM CLI (Serverless Application Model Command Line Interface), a tool that helps developers build, test, and deploy serverless applications on AWS. It's primarily written in Python and supports Python 3.8 and above.

## Common Commands

### Environment Setup

```bash
# Create a Python virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install in development mode
pip install -e .

# Set SAM_CLI_DEV environment variable to use 'samdev' instead of 'sam'
export SAM_CLI_DEV=1
```

### Testing and Validation

```bash
# Run linting and code formatting (Black)
black .

# Run unit tests with pytest
python -m pytest

# Run integration tests against development version
SAM_CLI_DEV=1 pytest -xvs tests/integration

# Type checking with mypy
mypy samcli
```

### Common SAM CLI Commands

```bash
# Initialize a new serverless application
sam init

# Build the application
sam build

# Test function locally
sam local invoke [FUNCTION_NAME]

# Start a local API Gateway
sam local start-api

# Deploy the application
sam deploy

# Sync changes to the cloud environment
sam sync

# Validate template
sam validate
```

## Code Architecture

The AWS SAM CLI codebase is organized as follows:

1. **samcli/cli** - Contains the CLI entry point and basic infrastructure
2. **samcli/commands** - Implementation of SAM CLI commands like `init`, `build`, `deploy`
3. **samcli/lib** - Core libraries and utilities used by various commands
4. **samcli/local** - Code for local testing and emulation of AWS services
5. **samcli/hook_packages** - Extensions for supporting various infrastructure as code tools (like Terraform)

### Key Components

- **Command Pattern**: Each CLI command is implemented in its own module under `samcli/commands/`
- **Click Framework**: The CLI uses the Click Python library for command-line interfaces
- **Docker Integration**: Uses Docker to run Lambda functions locally
- **AWS Integration**: Uses boto3 to interact with AWS services

## Development Guidelines

1. **Python Versions**: Support Python 3.8 and above. Test with multiple Python versions.
2. **Code Formatting**: Code is formatted using Black. Run black before submitting PRs.
3. **Docstrings**: Use numpy docstring format for all docstrings.
4. **Exceptions**: Custom exceptions should be used for expected failure conditions.
5. **Testing**: Code is thoroughly tested with unit, functional, and integration tests.
6. **Dependencies**: Dependencies are managed in `requirements/base.txt`, `requirements/dev.txt` and others.

## Documentation

The AWS SAM CLI documentation is available at:
- [AWS SAM Developer Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/index.html)
- [GitHub Wiki](https://github.com/aws/aws-sam-cli/wiki)