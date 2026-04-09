// 🔹 Fake Volunteer Profile
const volunteerProfile = {
  skills: ["first aid", "logistics", "crowd control"],
};

// 🔹 Fake Crisis Requirement
const crisisRequirement = {
  requiredSkills: ["first aid", "emergency response"],
};

function calculateMatch(): string {
  const matchedSkills = volunteerProfile.skills.filter(skill =>
    crisisRequirement.requiredSkills.includes(skill)
  );

  if (matchedSkills.length > 0) {
    return `✅ You are eligible for crisis response. Matched skills: ${matchedSkills.join(", ")}`;
  }

  return "❌ You are not eligible for this crisis response based on your current skills.";
}

let lastTopic: string | null = null;

export function getBotReply(message: string, userType: string | null): string {
  const msg = message.toLowerCase();

  // 🔹 Volunteer Topic
  if (msg.includes("volunteer")) {
    lastTopic = "volunteer";

    if (!userType) {
      return "You can register as a volunteer by clicking 'Join as Volunteer' on the landing page.";
    }

    return "You're already logged in as a volunteer 💙 You can explore opportunities in your dashboard.";
  }

  // 🔹 Organization Topic
  if (msg.includes("organization")) {
    lastTopic = "organization";
    return "Organizations can manage volunteers and post opportunities from their dashboard.";
  }

  // 🔹 Eligibility / Matching
  if (msg.includes("eligible") || msg.includes("crisis response")) {
    return calculateMatch();
  }

  // 🔹 Crisis Emergency
  if (msg.includes("crisis") || msg.includes("emergency")) {
    lastTopic = "crisis";
    return "If this is an emergency, please contact local authorities immediately 🚨";
  }

  // 🔹 Follow-up logic (memory)
  if (["how", "how?", "what", "what?", "where"].includes(msg)) {
    if (lastTopic === "volunteer") {
      return "To volunteer, complete your profile, verify your skills, and start applying for opportunities.";
    }

    if (lastTopic === "organization") {
      return "Organizations can register, verify their account, and start posting volunteer opportunities.";
    }

    if (lastTopic === "crisis") {
      return "During a crisis, volunteers will receive mobilization alerts based on their verified skills.";
    }
  }

  return "I'm still learning 🤖 Could you clarify your question?";
}