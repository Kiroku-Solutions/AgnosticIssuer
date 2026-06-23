# Auditoria de Seguridad y QA — nomad.md

> **Proyecto:** nomad.md
> **Version:** 0.0.1
> **Fecha:** 2026-06-22
> **Estado:** Steps 1-4 completados (Core + Adapter layer)

---

## 1. Resumen Ejecutivo

El proyecto nomad.md tiene un **core solido** (adapters + services) con una postura de seguridad de ~4.5/5. Sin embargo, la **app como deployable** presenta brechas criticas que deben resolverse antes de produccion.

**Verificaciones Pass/Fail:**

- TypeScript (`pnpm check`): PASS
- Tests (`pnpm test`): PASS (481 tests, 20 files)
- Lint (`pnpm lint`): WARN (2 archivos con Prettier warnings)
- Audit (`pnpm audit`): FAIL (2 vulnerabilidades activas)

---

## 2. Verificaciones de Build y Tests

### 2.1 Resultados

| Verificacion | Estado | Detalle                                     |
| :----------- | :----: | :------------------------------------------ |
| TypeScript   |  PASS  | 0 errors, 0 warnings                        |
| Tests        |  PASS  | 481 tests passing, 20 files                 |
| Lint         |  WARN  | docs/ers.md, docs/current-project-status.md |
| Audit        |  FAIL  | 2 vulnerabilidades activas                  |

### 2.2 Cobertura de Codigo

| Componente    | Stmts  | Lines  | Target | Estado |
| :------------ | :----: | :----: | :----: | :----: |
| Overall       | 78.37% | 79.54% |  80%   | Close  |
| adapters/     | 72.70% | 72.96% |  90%   | Below  |
| services/     | 84.94% | 87.73% |  80%   | Above  |
| remote-git.ts | 30.20% | 31.03% |  80%   |  Low   |
| renderer.ts   | 83.33% | 84.21% |  95%   |  Near  |

---

## 3. Vulnerabilidades Activas (pnpm audit)

### 3.1 CVE-2026-53550 — MODERATE

| Campo      | Valor                                           |
| :--------- | :---------------------------------------------- |
| Severity   | Moderate                                        |
| Package    | js-yaml                                         |
| Vulnerable | <=4.1.1                                         |
| Patched    | >=4.2.0                                         |
| Path       | gray-matter > js-yaml                           |
| Issue      | Quadratic-complexity DoS via merge key handling |

**Riesgo:** Un archivo YAML malicioso puede congelar el browser por segundos mediante crafted merge keys.

**Explotable en:**

- Local Mode: Si el usuario abre una carpeta de terceros
- Remote Mode: Si un PR introduce un archivo hostil

**Fix en package.json:**

```json
{
	"pnpm": {
		"overrides": {
			"js-yaml": "^4.2.0"
		}
	}
}
```

### 3.2 CVE-2024-47764 — LOW

| Campo      | Valor                  |
| :--------- | :--------------------- |
| Severity   | Low                    |
| Package    | cookie                 |
| Vulnerable | <0.7.0                 |
| Patched    | >=0.7.0                |
| Path       | @sveltejs/kit > cookie |

**Fix en package.json:**

```json
{
	"pnpm": {
		"overrides": {
			"cookie": "^0.7.0"
		}
	}
}
```

---

## 4. Analisis de Seguridad — Core Layer

### 4.1 Scorecard de Seguridad

| Dimension                               | Score | /5  |   Estado   |
| :-------------------------------------- | :---: | :-: | :--------: |
| PAT Handling (branded types + redactor) |   5   |  5  | Excelente  |
| Markdown XSS Sanitization               |   5   |  5  | Excelente  |
| File Integrity (FR-15)                  |   5   |  5  | Excelente  |
| Path Safety                             |  4.5  | 4.5 |  Muy bien  |
| Atomic Writes                           |   5   |  5  | Excelente  |
| FSA Permissions                         |   5   |  5  | Excelente  |
| Service Validation (FR-8)               |  4.5  | 4.5 |  Muy bien  |
| Transport Headers                       |   1   |  1  |  Critico   |
| Subresource Integrity                   |   1   |  1  |  Critico   |
| Trusted Types                           |   2   |  2  | Debilitado |
| Supply Chain                            |   2   |  2  | En riesgo  |
| Threat Model                            |   1   |  1  |  Critico   |
| Privacy/Telemetry                       |   5   |  5  | Excelente  |

**Aggregate Score:**

- Core (adapters + services): ~4.5/5
- Deployable app: ~2.5/5

### 4.2 Amenazas Identificadas

#### CRITICO — Transport Layer Headers

Missing headers in production build:

- Content-Security-Policy
- Strict-Transport-Security
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

**Impacto:** XSS, MITM, y otras vulnerabilidades de transporte.

**Mitigacion sugerida (Step 6):**

```http
# _headers para Netlify/Cloudflare Pages
Content-Security-Policy:
  default-src 'self';
  script-src 'self';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  connect-src 'self' https://cors.isomorphic-git.org https://*.github.com https://*.gitlab.com;
  object-src 'none';
  base-uri 'none';
  frame-ancestors 'none';
  form-action 'none';
  require-trusted-types-for 'script';

Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()
```

#### CRITICO — No Subresource Integrity

build/index.html tiene modulepreloads sin integrity=.

**Mitigacion:** Post-build script para agregar integrity= y crossorigin= a todos los assets.

#### MODERATE — js-yaml DoS (CVE-2026-53550)

El parser usa gray-matter > js-yaml con schema default.

**Recomendacion:**

```ts
// parser.ts — Forzar JSON_SCHEMA
matter(text, { engines: { yaml: { schema: yaml.JSON_SCHEMA } } });
```

#### MODERATE — No SECURITY.md

No existe canal de disclosure ni threat model documentado.

### 4.3 Lo Que Esta Bien

| Feature               | Implementacion                                                      |
| :-------------------- | :------------------------------------------------------------------ |
| PAT Branding          | TypeScript nominal types + runtime registry                         |
| Logger Redactor       | \_logger.ts filtra PATs y URLs sensibles                            |
| PAT Pattern Detection | GitHub classic, fine-grained, GitLab                                |
| DOMPurify Config      | FORBID_TAGS: script, iframe, object, embed, form, input, button     |
| DOMPurify Attr Block  | FORBID_ATTR: onerror, onload, onclick, onmouseover, onfocus, onblur |
| Atomic Writes         | Temp file + rename con rollback                                     |
| FSA Permission        | verifyPermission() antes de cada mutacion                           |
| Integrity Hash        | SHA-256 via Web Crypto API                                          |
| No Telemetry          | Zero analytics, zero off-device traffic                             |

---

## 5. Analisis de Calidad (QA)

### 5.1 Estado del Arte — Pasos Completados

| Step | Descripcion                 | Status  | Notes |
| :--- | :-------------------------- | :-----: | :---- |
| 1    | Bootstrap + adapter-static  |  Done   |       |
| 2    | Domain types                |  Done   |       |
| 3    | Service layer               |  Done   |       |
| 4    | Adapter layer + integration |  Done   |       |
| 5    | State layer                 | Pending |       |
| 6    | UI layer                    | Pending |       |
| 7    | Tests                       | Pending |       |
| 8    | Verify                      | Pending |       |

### 5.2 Gaps Conocidos

| Gap                                        | Prioridad |              Status              |
| :----------------------------------------- | :-------: | :------------------------------: |
| remote-git.ts coverage 30% (target 80%)    |   High    | Necesita mocks de isomorphic-git |
| renderer.ts coverage 83% (target 95%)      |  Medium   |   Necesita mocks de DOMPurify    |
| local-fs.ts y handle-store.ts no cubiertos |   High    |  Solo corren en client project   |
| Manual smoke test en Chrome pendiente      |  Medium   |      Humano debe verificar       |
| Buffer polyfill para production            |  Medium   |           Para Step 6            |
| Prettier warnings en docs                  |    Low    |            2 archivos            |

### 5.3 Inconsistencias Detectadas

1. **Prettier en docs:** docs/ers.md y docs/current-project-status.md tienen warnings de formato
   - Fix: pnpm format

2. **Coverage gaps:**
   - integrity.ts lineas 52-55 sin coverage
   - slugs.ts lineas 45-47 sin coverage
   - validator.ts sin cover lineas criticas

---

## 6. Recomendaciones de Prioridad

### Inmediato (antes de deploy)

1. Agregar pnpm overrides para js-yaml y cookie
2. Crear SECURITY.md con threat model y disclosure
3. Documentar CSP headers para hosts estaticos

### Corto plazo (Step 5-6)

4. Forzar yaml.JSON_SCHEMA en parser.ts para mitigar DoS
5. Post-build script para SRI en modulepreloads
6. Agregar require-trusted-types-for 'script' al CSP
7. Ejecutar pnpm format para fix Prettier warnings

### Largo plazo (Step 7-8)

8. Aumentar coverage de remote-git.ts a 80%+
9. Mockear DOMPurify para coverage de paths defensivos
10. Manual smoke test en Chrome antes de produccion

---

## 7. Checklist de Remediacion

### Antes de produccion:

- [ ] pnpm.overrides para js-yaml >=4.2.0 y cookie >=0.7.0
- [ ] SECURITY.md con threat model y canal de disclosure
- [ ] CSP headers documentados para Netlify/GH Pages/Cloudflare
- [ ] Fix: pnpm format
- [ ] Fix: yaml.JSON_SCHEMA en parser.ts

### Antes de Step 5 PR:

- [ ] pnpm audit clean
- [ ] Coverage >=80% en state layer
- [ ] Zero console.\* en state layer
- [ ] Zero as unknown as en state layer

---

## 8. Conclusion

El core del proyecto (adapters + services) tiene una postura de seguridad solida con ~4.5/5:

- PAT handling es excelente
- XSS sanitization es robusta
- File integrity via Web Crypto es correcta

Sin embargo, la app como deployable tiene brechas criticas:

- Transport layer sin headers硬化
- SRI faltante en assets
- 2 CVEs activas

**Recomendacion:** No hacer deploy publico hasta que se resuelvan los items de prioridad inmediata.
