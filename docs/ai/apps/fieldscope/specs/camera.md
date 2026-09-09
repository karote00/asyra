# Camera controls

FieldScope starts at eye level inside the greenhouse for first-person inspection. The camera is presentation state; movement does not change farm configuration or history.

| Input | Behavior |
| --- | --- |
| Left drag | Look around from the current camera position |
| Arrow keys | Turn the viewing direction in place |
| Shift + left drag | Pan in the camera plane, independent of zoom |
| Right drag | Look around from the current camera position |
| Wheel | Dolly toward/away from the current target; update displayed zoom |
| Alt + wheel, plus/minus | Optical field-of-view zoom |
| W/S, A/D, Q/E | Translate along local forward/back, left/right, down/up |
| Shift while moving | 4× speed |
| Right button + wheel | Adjust flight speed |
| Cmd/Ctrl + 1 | Fit the whole scene with at least 24 px padding |
| Cmd/Ctrl + 0 | Restore 100% zoom |

Default flight speed is 6 m/s, adjustable from 0.01 to 60 m/s. Translation moves camera and target together and does not slow down with zoom. Keyboard navigation requires canvas focus and stops on blur, key release, or teardown. Animation runs only while movement is active.

Zoom is bounded to 1–10,000%; dolly also respects the near-plane distance. Presets include overview, top, front, interior and joint inspection. Fitting uses the actual scene bounds and viewport size. Existing camera tests own the exact movement and zoom formulas.

Overview, top, front and fit controls remain available for site inspection. Pointer and arrow-key navigation use stationary look in every preset; selecting an overview does not switch dragging back to orbit.
