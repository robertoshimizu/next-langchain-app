export default function InnerLayout({
  children, // will be a page or nested layout
}: {
  children: React.ReactNode
}) {
  return (
    <section>
      {/* Include shared UI here e.g. a header or sidebar */}
      <nav>Marreta</nav>
 
      {children}
    </section>
  )
}