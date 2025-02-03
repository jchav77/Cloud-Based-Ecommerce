# lambda/order_processor.py
"""
A sample AWS Lambda function for processing orders.
This is just a simple example; you can customize it as needed.
"""

import json

def lambda_handler(event, context):
    # Log the incoming event (optional)
    print("Received event:", json.dumps(event))
    
    # Process the order here...
    # For demonstration, we simply return a success message.
    return {
        'statusCode': 200,
        'body': json.dumps('Order processed successfully!')
    }
