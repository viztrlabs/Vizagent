// M16: Prisma schema extensions for messaging (add to schema.prisma)
/*
model Conversation {
  id            String   @id @default(uuid())
  type          String   // direct, project, support, team
  title         String?
  projectId     String?  @map("project_id")
  participantIds String[] @map("participant_ids")
  lastMessageAt DateTime @map("last_message_at")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  messages      Message[]

  @@index([projectId])
  @@index([lastMessageAt])
  @@map("conversations")
}

model Message {
  id             String   @id @default(uuid())
  conversationId String   @map("conversation_id")
  senderId       String   @map("sender_id")
  senderType     String   @map("sender_type") // user, admin, system, agent
  content        String
  messageType    String   @default("text") @map("message_type")
  metadata       Json?
  readAt         DateTime? @map("read_at")
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  conversation   Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)

  @@index([conversationId])
  @@index([senderId])
  @@index([createdAt])
  @@map("messages")
}
*/