from flask import Flask, request, session, jsonify
from openai import OpenAI
import os
import json


# load dotenv
from dotenv import load_dotenv
load_dotenv()

# Set your OpenAI API key from an environment variable
client = OpenAI(
    api_key=os.getenv("OPENAI_KEY"),  # This is the default and can be omitted
)

tools = [{
    "type": "function",
    "function": {
        "name": "recommend",
        "description": "Recommend an outfit based on the user's preferences. This function should only be called if the user asks for an outfit, and never the same arguments twice.",
        "parameters": {
            "type": "object",
            "properties": {
                "recommendation": {
                    "type": "array",
                    "description": "List of firebase item IDs to recommend to the user.",
                    "items": {
                        "type": "string",
                        "description": "Firebase item ID to recommend to the user."
                    }
                },
                "message": {
                    "type": "string",
                    "description": "A message to the user very briefly explaining the recommendation."
                }
            },
            "required": [
                "recommendation",
                "message"
            ],
            "additionalProperties": False
        },
        "strict": True
    }
}]

app = Flask(__name__)
# Use a strong random secret key for session security in production!
app.secret_key = os.getenv("FUNNY_KEY")


def init_session(wardrobe):
    # Initialize session conversation history if not already set.
    if 'messages' not in session:
        session['messages'] = [
            {"role": "system", "content": "You are an assistant that can recommend outfits. Only if they ask for an outfit, you will provide with maximum 1 recommendation. If so, you will provide the firebase item IDs from the wardrobe below:\n\n" + wardrobe}]


@app.route('/chat', methods=['POST'])
def chat():
    data = request.get_json()
    user_message = data.get('message')
    wardrobe = data.get('wardrobe')
    if not user_message:
        return jsonify({"error": "No message provided"}), 400

    # Initialize session if needed.
    init_session(wardrobe)

    # Append the user's message to the conversation history.
    messages = session['messages']
    messages.append({"role": "user", "content": user_message})

    # Call the OpenAI API with the full conversation context.
    response = client.chat.completions.with_raw_response.create(
        model="gpt-4-turbo",
        messages=messages,
        tools=tools
    )
    api_return_dict = json.loads(response.text)
    text_reply = api_return_dict.get('choices')[0].get('message').get('content')
    calls = api_return_dict.get('choices')[0].get('message').get('tool_calls')

    # Get all messages
    if calls != None:
        for func in calls:
            if func.get('function').get('name') == 'recommend':
                reply = json.loads(func.get('function').get('arguments')).get('message')
                messages.append({"role": "assistant", "content": reply})

    # Append the assistant's reply to the session's conversation history.
    session['messages'] = messages  # update session

    return jsonify({"reply": text_reply, "recommendation": calls})


@app.route('/reset', methods=['POST'])
def reset():
    # Clear the conversation history to start a new session.
    session.pop('messages', None)
    return jsonify({"status": "Conversation reset."})


if __name__ == '__main__':
    app.run(debug=True)
