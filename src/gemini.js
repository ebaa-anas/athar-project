export const getAtharResponse = async (messagesHistory, userType) => {
  try {
    const response = await fetch("/api/openrouter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messagesHistory, userType }),
    });

    if (!response.ok) {
      return "Sorry, I'm having trouble connecting.";
    }

    const data = await response.json();
    return data.reply;
  } catch (error) {
    console.error(error);
    return "Connection failed.";
  }
};
