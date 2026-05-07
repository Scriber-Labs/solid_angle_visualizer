# app.py
"""
Flask application for the 3D Solid Angle Visualizer.

This script serves:
    - the main HTML interface
    - API endpoints for solid-angle calculations
    - API endpoints for sphere geometry generation

The numerical computations themselves are delegated to `
src.solid_angle` to keep the application modular and testable.

Author: Eigenscribe
Development note: LLM assistance was used during construction; implementation has been reviewed and adapted for this project.
Review status: Reviewed and maintained by Eigenscribe.
"""

# --------------------------------------------------------------------------- #
# Imports & type aliases
# --------------------------------------------------------------------------- #

from __future__ import annotations

import os
from typing import Any

from flask import Flask
from flask import jsonify
from flask import render_template
from flask import request

from src.solid_angle import *

# --------------------------------------------------------------------------- #
# 0️⃣ Type Aliases / protocols / constants
# --------------------------------------------------------------------------- #

DEBUG_MODE: bool = (
    os.environ.get("FLASK_DEBUG", "False").lower() == "true"
)

HOST: str = "0.0.0.0"
PORT: int = 5000

# --------------------------------------------------------------------------- #
# 1️⃣ Core definitions
# --------------------------------------------------------------------------- #

app: Flask = Flask(__name__)
app.config["DEBUG"] = DEBUG_MODE

# --------------------------------------------------------------------------- #
# 2️⃣ Public API
# --------------------------------------------------------------------------- #

@app.route("/")
def index() -> str:
    """
    Render the main application page.

    Returns
    -------
    str
        Rendered HTML template.
    """
    return render_template("index.html")

@app.route("/api/calculate_solid_angle", methods=["POST"])
def solid_angle_endpoint() -> Any:
    """
    Compute the solid angle for a spherical patch.

    Returns
    -------
    flask.Response
        JSON response containing the computed quantities.
    """
    data: dict[str, Any] = request.get_json()

    try:
        result = calculate_solid_angle(
            theta_start=float(data.get("theta_start", 0.0)),
            theta_end=float(data.get("theta_end", 0.785398)),
            phi_start=float(data.get("phi_start", 0.0)),
            phi_end=float(data.get("phi_end", 6.28319)),
        )

        return jsonify(result)

    except (ValueError, TypeError) as exc:
        return jsonify({"❌ error": str(exc)}), 400

@app.route("/api/calculate_differential", methods=["POST"])
def differential_endpoint() -> Any:
    """
    Compute the differential solid-angle approximation.

    Returns
    -------
    flas.Response
        JSON response containing differential quantities.
    """
    data: dict[str, Any] = request.get_json()

    try:
        result = calculate_differential_solid_angle(
            theta=float(data.get("theta", 0.785398)),
            dtheta=float(data.get("dtheta", 0.157079))
        )

        return jsonify(result)

    except (ValueError, TypeError) as exc:
        return jsonify({"❌ error": str(exc)}), 400

@app.route("/api/generate_sphere_data", methods=["POST"])
def sphere_data_endpoint() -> Any:
    """
    Generate sphere vertex data for visualization.

    Returns
    -------
    flask.Response
        JSON response containing sphere vertices.
    """
    data: dict[str, Any] = request.get_json()

    try:
        resolution: int = int(data.get("resolution", 50))

        vertices = generate_sphere_vertices(resolution=resolution)

        return jsonify(
            {
                "vertices": vertices,
                "resolution": resolution,
            }
        )

    except (ValueError, TypeError) as exc:
        return jsonify({"❌ error": str(exc)}), 400

# --------------------------------------------------------------------------- #
# 3️⃣ Private helpers
# --------------------------------------------------------------------------- #


def _print_startup_banner() -> None:
    """
    Print application startup information.
    """
    print("-" * 80)
    print("3D Sphere Solid Angle Visualizer")
    print(f"Debug mode : {DEBUG_MODE}")
    print(f"HOST       : {HOST}")
    print(f"PORT       : {PORT}")
    print("=" * 80)

# --------------------------------------------------------------------------- #
# 4️⃣ Smoke tests
# --------------------------------------------------------------------------- #


def run_smoke_tests() -> None:
    """
    Run lightweight sanity checks for the numerical backend.
    """
    solid_angle_result = calculate_solid_angle(
        theta_start=0.0,
        theta_end=0.785398,
        phi_start=0.0,
        phi_end=6.28319,
    )

    differential_result = calculate_differential_solid_angle(
        theta=0.785398,
        dtheta=0.157079,
    )

    print("\n[Smoke Test] Solid Angle:")
    print(solid_angle_result)

    print("\n[Smoke Test] Differential Solid Angle:")
    print(differential_result)

# --------------------------------------------------------------------------- #
# 5️⃣ Entry point
# --------------------------------------------------------------------------- #


def main() -> None:
    """
    Launch the Flask development server.
    """
    _print_startup_banner()

    if DEBUG_MODE:
        run_smoke_tests()

    app.run(
        host=HOST,
        port=PORT,
        debug=DEBUG_MODE,
    )

if __name__ == "__main__":
    main()