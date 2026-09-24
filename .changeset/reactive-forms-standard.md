---
"@recursica/adapter-angular-material": minor
---

Every form-shaped component (`TextField`, `TextArea`, `NumberInput`, `Dropdown`, `DatePicker`, `TimePicker`, `AutoComplete`, `Checkbox`, `CheckboxGroup`, `Switch`, `SwitchGroup`, `RadioGroup`, `Slider`, `SegmentedControl`) now implements `ControlValueAccessor`, so `[formControl]`/`[(ngModel)]`/`formControlName` bind directly onto the Recursica element instead of throwing `NG01203`. `value`/`(valueChange)` (or `checked`/`(checkedChange)`) still work unchanged — this is additive, not a breaking change.
