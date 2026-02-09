try:
    from strands import Agent
    print("Agent imported successfully")
except ImportError as e:
    print(f"Failed to import Agent: {e}")

try:
    from strands.models import BedrockModel
    print("BedrockModel imported successfully from strands.model")
except ImportError as e:
    print(f"Failed to import BedrockModel from strands.model: {e}")
    try:
        from strands.models import BedrockModel
        print("BedrockModel imported from strands.models instead")
    except ImportError as e2:
        print(f"Failed to import from strands.models too: {e2}")
