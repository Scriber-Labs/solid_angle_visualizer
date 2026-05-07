# src/solid_angle.py
"""
Solid angle computation utilities.

This module contains numerical routines for computing:
- finite solid angles
- differential solid angles
- spherical coordinate geometry
- unit sphere sampling

Author: Eigenscribe
Development note: LLM assistance was used during construction; implementation has been reviewed and adapted for this project.
Review status: Reviewed and maintained by Eigenscribe.
Date: 05-06-2026
"""

# --------------------------------------------------------------------------- #
# Imports & type aliases
# --------------------------------------------------------------------------- #

from __future__ import annotations

from typing import Final

import numpy as np

# --------------------------------------------------------------------------- #
# 0️⃣ Typing helpers / protocols / constants
# --------------------------------------------------------------------------- #

PI: Final[float] = float(np.pi)
TWO_PI: Final[float] = 2.0 * PI

# --------------------------------------------------------------------------- #
# 1️⃣ Core definitions
# --------------------------------------------------------------------------- #

def clamp_theta(theta: float) -> float:
    """
    Clamp theta to the valid spherical coordinate interval.

    Parameters
    ----------
    theta : float
        Polar angle in radians

    Returns
    -------
    float
        Clamped polar angle.
    """
    return max(0.0, min(PI, theta))

def clamp_phi(phi: float) -> float:
    """
    Clamp phi to the valid azimuthal interval.

    Parameters
    -----------
    phi : float
        Azimuthal angle in radians

    Returns
    ------
    float
        Clamped azimuthal angle.
    """
    return max(0.0, min(TWO_PI, phi))


# --------------------------------------------------------------------------- #
# 2️⃣ Public API
# --------------------------------------------------------------------------- #

def calculate_solid_angle(
    theta_start: float,
    theta_end: float,
    phi_start: float,
    phi_end: float,
) -> dict[str, float | list[float]]:
    """
    Compute the solid angle subtended on a unit sphere.

    Parameters
    ----------
    theta_start : float
        Initial polar angle in radians.

    theta_end : float
        Final polar angle in radians.

    phi_start : float
        Initial azimuthal angle in radians.

    phi_end : float
        Final azimuthal angle in radians.

    Returns
    -------
    dict[str, float | list[float]]
        Dictionary containing:
        - solid angle
        - surface area
        - angular ranges
    """

    theta_start = clamp_theta(theta_start)
    theta_end = clamp_theta(theta_end)

    phi_start = clamp_phi(phi_start)
    phi_end = clamp_phi(phi_end)

    solid_angle = abs(
        (phi_end - phi_start) * (np.cos(theta_start) - np.cos(theta_end))
    )

    return {
        "solid_angle": float(solid_angle),
        "surface_area": float(solid_angle),
        "theta_range": [theta_start, theta_end],
        "phi_range": [phi_start, phi_end],
    }

def calculate_differential_solid_angle(
    theta: float,
    dtheta: float,
) -> dict[str, float]:
    """
    Compute a differential solid angle element.

    Parameters
    ----------
    theta : float
        Polar angle in radians.

    dtheta : float
        Differential angular increment.

    Returns
    -------
    dict[str, float]
        Dictionary containing:
        - differential solid angle
        - local geometric quantities
    """

    theta = clamp_theta(theta)
    dtheta = max(0.01, min(0.5, dtheta))

    d_omega = TWO_PI * np.sin(theta) * dtheta

    return {
        "differential_solid_angle": float(d_omega),
        "surface_area": float(d_omega),
        "theta": float(theta),
        "dtheta": float(dtheta),
        "sin_theta": float(np.sin(theta)),
        "theta_deg": float(np.degrees(theta)),
    }

def generate_sphere_vertices(
    resolution: int,
) -> np.ndarray:
    """
    Generate Cartesian vertices on the unit sphere.

    Parameters
    ----------
    resolution : int
        Angular discreteization resolution.

    Returns
    -------
    np.ndarray
        Array of shape (N, 3) containing sphere vertices.
    """

    theta = np.linspace(0.0, PI, resolution)
    phi = np.linspace(0.0, TWO_PI, resolution)

    vertices: list[list[float]] = []

    for t in theta:
        for p in phi:
            x = np.sin(t) * np.cos(p)
            y = np.sin(t) * np.sin(p)
            z = np.cos(t)

            vertices.append([x, y, z])

    return np.asarray(vertices)

# --------------------------------------------------------------------------- #
# 3️⃣ Smoke test
# --------------------------------------------------------------------------- #
def _run_smoke_tests() -> None:
    """
    Sanity check: basic numerical operations for solid angle calculations.
    """

    print("💨 Kuramoto smoke test")

    result = calculate_solid_angle(
        theta_start=0.0,
        theta_end=PI / 4.0,
        phi_start=0.0,
        phi_end=TWO_PI,
    )

    assert result["solid_angle"] > 0.0
    print("    ✔️ solid angle calculation OK")

    vertices = generate_sphere_vertices(10)

    assert vertices.shape[1] == 3
    print("    ✔️ vertices shape OK")

    print("\n✅ solid_angle smoke test passed.")


def main() -> None:
    """
    Execute main smoke tests.
    """

    _run_smoke_tests()

# --------------------------------------------------------------------------- #
# 4️⃣ Entry point
# --------------------------------------------------------------------------- #
if __name__ == "__main__":
    main()
