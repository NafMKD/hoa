## Parking Sticker Scramble Rule (Position Swap)

To avoid exposing unit numbers on parking stickers, plate and unit data are scrambled using a fixed position-based rule.

### Input
- Plate format: 3 AA B34567 
- Unit format: SA07

### Rule
1. Remove spaces from the plate and completely ignore `Letter (B)` from the plate if present
2. Split plate into:
   - Left: 3AA
   - Right: last 5 digits 34567
3. Split unit into:
   - Floor letter (first character) S
   - Full unit code (A07)
4. Assemble sticker as:
    <PlateRight><Floor> | <PlateLeft><UnitCode>

### Example
Plate: 3 AA B34567
Unit:  SA07

Sticker: 34567S | 3AAA07

The sticker does not reveal the actual unit number.