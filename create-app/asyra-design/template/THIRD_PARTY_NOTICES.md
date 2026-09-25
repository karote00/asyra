# Third-party image processing

The application's own license remains MIT. Third-party dependencies retain their
own licenses; the MIT license does not replace those terms.

## sharp

The backend uses sharp 0.35.4 under Apache License 2.0. Its license is retained in
[licenses/sharp-Apache-2.0.txt](licenses/sharp-Apache-2.0.txt). sharp runs locally;
it does not require a paid image-processing service or API key.

<a href="https://github.com/lovell/sharp" target="_blank" rel="noopener noreferrer">sharp source and copyright notices</a>

## Native dependencies

sharp installs platform-specific optional packages, including libvips and its
image libraries. Their licenses include LGPL-3.0-or-later, MIT, BSD and others;
they are not all Apache-2.0. Consult the actual installed
`@img/sharp-libvips-<platform>/README.md` for that platform's library list and
licenses. Keep the installed dependency packages and their notices intact.

<a href="https://github.com/lovell/sharp-libvips" target="_blank" rel="noopener noreferrer">Native build scripts, versioned source locations and license information</a>

This source repository and generated project template declare npm dependencies;
they do not redistribute prebuilt sharp/libvips binaries. If you later bundle
those binaries into a downloadable application, container or installer, assess
the licenses of the exact shipped libraries, supply their required notices and
licenses, and satisfy applicable LGPL source/relinking requirements. A link to
this document alone does not satisfy every binary-redistribution obligation.

## Maintenance

The pinned version was checked against upstream sharp security advisories when
introduced. Pinning is reproducibility, not a promise of permanent security;
review newer advisories and dependency updates before distribution. This backend
admits PNG/JPEG/WebP signatures only, rejects oversized inputs, and limits image work.

<a href="https://github.com/lovell/sharp/security/advisories" target="_blank" rel="noopener noreferrer">sharp security advisories</a>
