# Email templates (Brevo)

- `invitation-template.html` – vernissage invitation. Edit the parts marked `<!-- EDIT -->` per exhibition,
  paste into Brevo (Campaign > Email > "Paste your code"), send to list "Vernissage".
  Subject (always the same): "87artspace | You’re invited". Sender: 87artspace <info@87artspace.com>.
- `double-optin.html` – confirmation email used by the Brevo form "Website – Get invited" (button link `{{ doubleoptin }}`),
  redirect after confirmation: https://87artspace.com/confirmed.html

- `invitation-traces-of-motion.html` – German invitation for Traces of Motion (Steffen Köhl), artist-approved text.
  Images are served from assets/img/exhibitions/traces-of-motion/ (already on main).
- `finissage-beyond-the-frame.html` – German finissage invitation for Beyond the Frame (21.11.2026) with a teaser for Traces of Motion.
