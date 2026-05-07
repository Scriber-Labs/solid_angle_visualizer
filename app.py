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