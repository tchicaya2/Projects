CREATE TABLE IF NOT EXISTS "users"(
"id" INTEGER,
"username" TEXT NOT NULL UNIQUE,
"hash" TEXT NOT NULL,
PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "customs" (
    "id" INTEGER,
    "user_id" INTEGER,
    "nom" TEXT NOT NULL UNIQUE,
    "principe" TEXT NOT NULL,
    "domaine" TEXT NOT NULL DEFAULT "Mon Quiz",
    PRIMARY KEY("id")
);

CREATE TABLE IF NOT EXISTS "stats" (
    "id" INTEGER,
    "user_id" INTEGER,
    "domaine" TEXT,
    "posées" INTEGER,
    "trouvées" INTEGER,
    PRIMARY KEY("id")
);
