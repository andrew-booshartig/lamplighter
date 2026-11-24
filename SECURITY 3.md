# Security and privacy

The Lamplighter Project has no server, no accounts and no network calls of its own: what a person writes stays in their browser. If you find a way it could leak what someone wrote, load code from another site, or otherwise harm the people who use it, please report it privately: on GitHub, open the **Security** tab and choose **Report a vulnerability**. For anything that is not sensitive, an ordinary issue is fine.

What the project promises, and how to check each promise, is on the "Our promises" and "Methods and standards" pages inside the app. The privacy test (`lamplighter/tests/privacy.test.js`) reads the whole app on every build and fails on a network call, a tracker, a cookie, or a font or script from another site.
