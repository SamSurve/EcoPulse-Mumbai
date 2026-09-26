from typing import Dict, List, Optional
from app.models.schemas import Location

MUMBAI_LOCATIONS: Dict[str, Location] = {
    "borivali": Location(
        id="borivali",
        name="Borivali",
        latitude=19.2307,
        longitude=72.8567,
        zone="Western Suburbs",
        ward="R/Central",
        nearest_station="Borivali East (MPCB)"
    ),
    "kandivali": Location(
        id="kandivali",
        name="Kandivali",
        latitude=19.2047,
        longitude=72.8522,
        zone="Western Suburbs",
        ward="R/South",
        nearest_station="Borivali East (MPCB)"
    ),
    "malad": Location(
        id="malad",
        name="Malad",
        latitude=19.1860,
        longitude=72.8485,
        zone="Western Suburbs",
        ward="P/North",
        nearest_station="Malad West (SAFAR)"
    ),
    "andheri": Location(
        id="andheri",
        name="Andheri",
        latitude=19.1136,
        longitude=72.8697,
        zone="Western Suburbs",
        ward="K/West & K/East",
        nearest_station="Andheri (SAFAR/IITM)"
    ),
    "bandra": Location(
        id="bandra",
        name="Bandra",
        latitude=19.0596,
        longitude=72.8295,
        zone="Western Suburbs",
        ward="H/West",
        nearest_station="Bandra Kherwadi (MPCB)"
    ),
    "bkc": Location(
        id="bkc",
        name="Bandra Kurla Complex",
        latitude=19.0662,
        longitude=72.8665,
        zone="Central Suburbs",
        ward="H/East",
        nearest_station="Bandra Kurla Complex (MPCB)"
    ),
    "dadar": Location(
        id="dadar",
        name="Dadar",
        latitude=19.0178,
        longitude=72.8478,
        zone="South-Central Mumbai",
        ward="G/North",
        nearest_station="Dadar (BMC/MPCB)"
    ),
    "worli": Location(
        id="worli",
        name="Worli",
        latitude=19.0134,
        longitude=72.8154,
        zone="South Mumbai",
        ward="G/South",
        nearest_station="Worli (SAFAR/IITM)"
    ),
    "colaba": Location(
        id="colaba",
        name="Colaba",
        latitude=18.9067,
        longitude=72.8147,
        zone="South Mumbai",
        ward="A Ward",
        nearest_station="Colaba (MPCB)"
    ),
    "sion": Location(
        id="sion",
        name="Sion",
        latitude=19.0434,
        longitude=72.8634,
        zone="Central Mumbai",
        ward="F/North",
        nearest_station="Sion (MPCB)"
    ),
    "kurla": Location(
        id="kurla",
        name="Kurla",
        latitude=19.0726,
        longitude=72.8845,
        zone="Central / Mithi Basin",
        ward="L Ward",
        nearest_station="Kurla (MPCB)"
    ),
    "powai": Location(
        id="powai",
        name="Powai",
        latitude=19.1176,
        longitude=72.9060,
        zone="Eastern Suburbs",
        ward="S Ward",
        nearest_station="Powai IIT Bombay (MPCB)"
    ),
    "chembur": Location(
        id="chembur",
        name="Chembur",
        latitude=19.0622,
        longitude=72.8975,
        zone="Eastern Suburbs",
        ward="M/West",
        nearest_station="Chembur (MPCB)"
    ),
    "mulund": Location(
        id="mulund",
        name="Mulund",
        latitude=19.1726,
        longitude=72.9565,
        zone="North-Eastern Suburbs",
        ward="T Ward",
        nearest_station="Mulund (MPCB)"
    )
}


def get_all_locations() -> List[Location]:
    """Return all registered Mumbai locations."""
    return list(MUMBAI_LOCATIONS.values())


def get_location_by_id(location_id: str) -> Optional[Location]:
    """Retrieve a specific Mumbai location by its slug ID."""
    if not location_id:
        return None
    normalized_id = location_id.strip().lower()
    return MUMBAI_LOCATIONS.get(normalized_id)


def is_valid_location(location_id: str) -> bool:
    """Check if the given location ID exists in the registry."""
    if not location_id:
        return False
    return location_id.strip().lower() in MUMBAI_LOCATIONS
