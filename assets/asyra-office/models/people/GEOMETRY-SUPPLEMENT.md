# Character Geometry - Profile Dispatch

Use [the character index](people-model-spec.json) to select one complete profile.
There is no shared inline female anatomy or clothing baseline to combine with
another profile. Superseded baseline dimensions and the instruction to omit
hidden skin have been removed from the current construction authority.

| Preset | Construction                          | Numeric inputs                                | Review state                                     |
| ------ | ------------------------------------- | --------------------------------------------- | ------------------------------------------------ |
| Male   | [Male puppet](PUPPET-SPEC.md)         | [Male values](man-puppet-model-spec.json)     | Documentation approved for commit; model pending |
| Female | [Female puppet](WOMAN-PUPPET-SPEC.md) | [Female values](woman-puppet-model-spec.json) | Documentation approved for commit; model pending |

Both profiles use the same logical decomposition, coordinate conventions,
replaceable appearance policy and geometry equations. They have distinct body
profiles, dimensions, hair and garment interiors. Shared slot names do not
certify cross-profile fit. Do not substitute male numeric defaults for female
values or treat either original sheet as a calibrated projection.

Each profile includes complete skin anatomy beneath removable clothing,
independent hair leaves and named attachment sockets. Neither document is an
implemented rig, wardrobe, model exporter or app factory. Original reference
images remain unchanged; follow each measurement record for superseded caption
notes, source hashes and numeric authority.
