import math
from functools import wraps
from flask import request, jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity

def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees).
    Returns distance in miles.
    """
    R = 3959.0  # Earth radius in miles

    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad

    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    distance = R * c
    return distance


def jwt_required_custom(fn):
    """
    Custom JWT decorator that properly checks and validates the Bearer token.
    Returns cleaner error messages instead of Flask-JWT default HTML errors.
    """
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization")

        if not auth_header:
            return jsonify({"error": "Authorization header missing"}), 401

        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Authorization header must start with 'Bearer'"}), 401

        try:
            # This now works because we validated the header format first
            verify_jwt_in_request()
        except Exception:
            return jsonify({"error": "Invalid or expired token"}), 401

        return fn(*args, **kwargs)

    return wrapper
