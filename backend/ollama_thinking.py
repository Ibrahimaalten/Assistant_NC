from typing import List, Optional, Any
from langchain_community.chat_models import ChatOllama
from langchain_core.messages import AIMessage, HumanMessage
from pydantic import Field

class ChatOllamaWithThinking(ChatOllama):
    thinking_mode: bool = Field(default=False)

    def _convert_messages_to_ollama_format(self, messages: List[Any]) -> List[dict]:
        return [{"role": "user" if isinstance(m, HumanMessage) else "assistant", "content": m.content} for m in messages]

    def _llm_type(self) -> str:
        return "chat-ollama-with-thinking"

    def _call(self, prompt: str, stop: Optional[List[str]] = None) -> str:
        import ollama
        client = ollama.Client(base_url=self.base_url)
        messages = [{"role": "user", "content": prompt}]
        response = client.chat(model=self.model, messages=messages, think=self.thinking_mode)
        self.thinking_text = response.get("message", {}).get("thinking", "")
        return response.get("message", {}).get("content", "")
