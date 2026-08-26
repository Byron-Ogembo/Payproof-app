"use server";

import { auth } from "@/auth";
import { answerBusinessQuestion, type BusinessAssistantAnswer } from "@/lib/ai/business-assistant";

export async function askBusinessAssistant(question: string): Promise<BusinessAssistantAnswer> {
  const session = await auth();
  if (!session?.user?.businessId || !session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return answerBusinessQuestion(question, session.user.businessId, session.user.id);
}
