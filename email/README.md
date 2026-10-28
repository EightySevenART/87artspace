# Email templates (Brevo)

- `invitation-template.html` – vernissage invitation. Edit the parts marked `<!-- EDIT -->` per exhibition,
  paste into Brevo (Campaign > Email > "Paste your code"), send to list "Vernissage".
  Subject (always the same): "You're invited: New vernissage at Artspace87". Sender: Artspace87 <info@87artspace.com>.
- `double-optin.html` – confirmation email used by the Brevo form "Website – Get invited" (button link `{{ doubleoptin }}`),
  redirect after confirmation: https://87artspace.com/confirmed.html
