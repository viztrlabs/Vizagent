// M16: Prisma schema extensions for support (add to schema.prisma)
/*
model Notification {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  tenantId    String   @map("tenant_id")
  category    String
  title       String
  body        String
  priority    String   @default("normal")
  channels    String[] @map("channels")
  data        Json?
  actionUrl   String?  @map("action_url")
  actionText  String?  @map("action_text")
  status      String   @default("pending") // pending, sent, failed
  readAt      DateTime? @map("read_at")
  createdAt   DateTime @default(now()) @map("created_at")

  deliveries  NotificationDelivery[]

  @@index([userId])
  @@index([tenantId])
  @@index([category])
  @@index([status])
  @@index([createdAt])
  @@map("notifications")
}

model NotificationDelivery {
  id             String   @id @default(uuid())
  notificationId String   @map("notification_id")
  channel        String
  status         String   @default("pending") // pending, sent, failed
  messageId      String?  @map("message_id")
  error          String?
  sentAt         DateTime? @map("sent_at")

  notification   Notification @relation(fields: [notificationId], references: [id], onDelete: Cascade)

  @@index([notificationId])
  @@index([channel])
  @@index([status])
  @@map("notification_deliveries")
}

model NotificationPreferences {
  userId    String   @id @map("user_id")
  email     Boolean  @default(true)
  inApp     Boolean  @default(true)
  telegram  Boolean  @default(false)
  discord   Boolean  @default(false)
  whatsapp  Boolean  @default(false)
  push      Boolean  @default(false)
  categories Json     @default("{}")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@map("notification_preferences")
}

model NotificationChannelConfig {
  tenantId  String   @map("tenant_id")
  channel   String
  enabled   Boolean  @default(false)
  config    Json     @default("{}")
  updatedAt DateTime @updatedAt @map("updated_at")

  @@id([tenantId, channel])
  @@map("notification_channel_configs")
}

model FAQItem {
  id           String   @id @default(uuid())
  tenantId     String   @map("tenant_id")
  question     String
  answer       String
  category     String
  tags         String[]
  viewCount    Int      @default(0) @map("view_count")
  helpfulCount Int      @default(0) @map("helpful_count")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@unique([tenantId, question], name: "tenantId_question")
  @@index([tenantId])
  @@index([category])
  @@map("faq_items")
}

model SupportTicket {
  id          String   @id @default(uuid())
  userId      String   @map("user_id")
  tenantId    String   @map("tenant_id")
  subject     String
  status      String   @default("open") // open, in_progress, resolved, closed
  priority    String   @default("normal")
  category    String
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")
  resolvedAt  DateTime? @map("resolved_at")

  messages    SupportMessage[]

  @@index([userId])
  @@index([tenantId])
  @@index([status])
  @@index([category])
  @@map("support_tickets")
}

model SupportMessage {
  id          String   @id @default(uuid())
  ticketId    String   @map("ticket_id")
  senderId    String   @map("sender_id")
  senderType  String   @map("sender_type") // user, agent, ai
  content     String
  createdAt   DateTime @default(now()) @map("created_at")

  ticket      SupportTicket @relation(fields: [ticketId], references: [id], onDelete: Cascade)

  @@index([ticketId])
  @@index([senderId])
  @@map("support_messages")
}
*/