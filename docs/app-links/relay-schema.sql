-- The whole of the relay's storage.
--
-- One row is one sealed blob waiting for one person, from one other person.
-- The primary key is what makes a resend replace rather than accumulate: what
-- is here is the latest thing somebody sent, not a history.
--
-- Nothing in this table is readable by the relay. `body` is the sealed wire
-- exactly as the sending phone produced it, and both fingerprints are the
-- public halves of keys this server has never seen the private side of.

CREATE TABLE IF NOT EXISTS mail (
  -- Whose mailbox this is. A compact key fingerprint, 16 uppercase hex.
  to_fp      TEXT NOT NULL,
  -- Who put it there. Checked against a signature before the row is written,
  -- so this one is not merely a claim the way a filename would be.
  from_fp    TEXT NOT NULL,
  -- The sealed wire, as JSON text. Ciphertext to everything on this side.
  body       TEXT NOT NULL,
  -- Kept so the size ceiling can be reported on without reading the body.
  bytes      INTEGER NOT NULL,
  stored_at  TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  PRIMARY KEY (to_fp, from_fp)
);

-- The sweep on every request orders by this, so it is worth having.
CREATE INDEX IF NOT EXISTS mail_expires_at ON mail (expires_at);

-- Where to send a wake-up when mail arrives (M1, 1.0.62.2).
--
-- One row per mailbox: the Firebase Cloud Messaging address of the phone that
-- holds that key. Written only by a request signed with the mailbox's own key,
-- so nobody can point somebody else's wake-ups at their own phone. The wake-up
-- this enables carries nothing but the word that mail is waiting: no sender, no
-- size, no content. It is one more thing the relay knows (that a fingerprint
-- belongs to some Android phone Google can reach), and it is written down here
-- rather than glossed over.
CREATE TABLE IF NOT EXISTS push_tokens (
  mailbox    TEXT PRIMARY KEY,
  token      TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
