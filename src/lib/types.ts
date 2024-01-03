interface User {
  id: number; // Since the id is autoincremented, it's an integer
  email: string; // String field, marked as unique in the schema
  name?: string | null; // Optional string field (indicated by '?')
  createdAt: Date; // DateTime field
  clerk_id?: string | null; // Optional string field
  stripe_customer_id?: string | null; // Optional string field
  stripe_subscription_id?: string | null; // Optional string field
}
