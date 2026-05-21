"""Security placeholders for future authentication work.

Phase 0 intentionally does not implement JWT, password hashing, sessions, or tenant identity.
"""


def get_password_hash(_: str) -> str:
    raise NotImplementedError("Password hashing will be added in the auth and tenant foundation phase.")


def verify_password(_: str, __: str) -> bool:
    raise NotImplementedError("Password verification will be added in the auth and tenant foundation phase.")


def create_access_token(_: dict[str, object]) -> str:
    raise NotImplementedError("JWT creation will be added in the auth and tenant foundation phase.")
