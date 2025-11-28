# ScanMaster CAD Engine v3.0 – Error Report

## 1. Summary

When calling the external **ScanMaster CAD Engine v3.0** from the Node.js backend (Express), the API endpoint:

- `POST /api/cad/engine/parts`

returns **HTTP 500** with the response body:

```json
{"error": "Failed to generate CAD solid via ScanMaster engine"}
```

Relevant log messages from the server:

- `CAD engine failed`
- `Error while generating CAD solid via ScanMaster engine`
- `POST /api/cad/engine/parts 500 in ~3491ms :: {"error":"Failed to generate CAD solid via ScanMaster engine"}`
- `Slow request detected: POST /api/cad/engine/parts took ~3495.20ms`

**Conclusion:**
The Node.js server itself does not crash. It treats the **Python CAD engine process** as a failure because the process exits with a **non‑zero exit code** and does not provide a clear success indication (no `success: true` JSON and/or no STEP file at the expected `outputPath`).
We need help from the CAD engine side (Python/CLI) to understand why these jobs fail and to standardize the success/failure output.

---

## 2. Environment

- OS: **Windows**
- Backend:
  - Node.js + Express (TypeScript)
  - Entry point: `server/index.ts`
- External CAD Engine:
  - Folder root: `D:\ScanMaster_CAD_Engine\`
  - CLI script: `scanmaster_cli.py`
  - Python virtualenv: `D:\ScanMaster_CAD_Engine\venv\`

### 2.1. Relevant Environment Variables (`.env`)

```dotenv
# Python executable for CAD jobs
PYTHON_BIN="D:\\ScanMaster_CAD_Engine\\venv\\Scripts\\python.exe"

# Main CLI entrypoint for ScanMaster CAD Engine v3.0
SCANMASTER_CAD_SCRIPT="D:\\ScanMaster_CAD_Engine\\scanmaster_cli.py"

# Engine root (used by drawing engine / CAD engine integration)
CAD_ENGINE_ROOT="D:\\ScanMaster_CAD_Engine"

# FreeCAD configuration
FREECAD_PATH="C:\\Program Files\\FreeCAD 0.21\\bin"

# TechDraw template path
TECHDRAW_TEMPLATE_PATH="C:\\Program Files\\FreeCAD 0.21\\data\\Mod\\TechDraw\\Templates\\A4_Portrait_ISO7200TD.svg"
```

These variables are loaded by `dotenv` in `server/index.ts`.

---

## 3. Backend API Definition (Node.js)

### 3.1. Endpoint

- **HTTP Method:** `POST`
- **URL:** `/api/cad/engine/parts`
- **Auth:** Currently a mock middleware `mockAuth` sets `req.userId` either from `x-user-id` header or default UUID-like string.

The route is defined in `server/routes.ts`:

```ts
app.post("/api/cad/engine/parts", mockAuth, async (req: Request, res: Response) => {
  try {
    logger.info("Received CAD solid generation request", {
      body: req.body,
      userId: (req as any).userId,
    });

    const parsed = cadSolidJobSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.error("CAD solid job validation failed", {
        error: parsed.error.flatten(),
        body: req.body,
        fieldErrors: parsed.error.flatten().fieldErrors,
      });

      return res.status(400).json({
        error: "Invalid CAD solid job payload",
        details: parsed.error.flatten(),
        fieldErrors: parsed.error.flatten().fieldErrors,
        receivedBody: req.body,
      });
    }

    const cadScript = process.env.SCANMASTER_CAD_SCRIPT;
    if (!cadScript || cadScript.trim().length === 0) {
      return res.status(500).json({
        error: "SCANMASTER_CAD_SCRIPT environment variable is not set. Point it to your generate_drawing.py or python_api_integration.py entrypoint.",
      });
    }

    const pythonBin = process.env.PYTHON_BIN || "python";

    const userId = String((req as any).userId || "anonymous");
    const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const cad3dOutputRoot = path.join(process.cwd(), "cad-3d-output");
    const cad3dUserDir = path.join(cad3dOutputRoot, userId);
    const jobDir = path.join(process.cwd(), "cad-engine-jobs");

    fs.mkdirSync(cad3dUserDir, { recursive: true });
    fs.mkdirSync(jobDir, { recursive: true });

    const outputStepPath = path.join(cad3dUserDir, `${jobId}.step`);

    const jobPayload = {
      jobId,
      engine: "ScanMaster CAD Engine v3.0",
      shapeType: parsed.data.shapeType,
      parameters: parsed.data.parameters,
      calibrationData: parsed.data.calibrationData,
      metadata: parsed.data.metadata,
      outputFormat: "step",
      outputPath: outputStepPath,
    };

    const jobFilePath = path.join(jobDir, `${jobId}.json`);
    await fs.promises.writeFile(jobFilePath, JSON.stringify(jobPayload, null, 2), "utf8");

    const pythonResult = await new Promise<any>((resolve, reject) => {
      const child = spawn(pythonBin, [cadScript, "--json", jobFilePath], {
        stdio: ["ignore", "pipe", "pipe"],
      });

      let stdout = "";
      let stderr = "";

      child.stdout.on("data", (chunk) => {
        stdout += chunk.toString();
      });

      child.stderr.on("data", (chunk) => {
        stderr += chunk.toString();
      });

      child.on("error", (err) => {
        reject(err);
      });

      child.on("close", (code) => {
        logger.info("ScanMaster CAD Engine process completed", {
          exitCode: code,
          stdout: stdout,
          stderr: stderr,
        });

        // Try to parse stdout as JSON
        let parsedOut: any;
        try {
          const lines = stdout.trim().split("\n");
          let jsonLine: string | null = null;
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i].trim();
            if (line.startsWith("{") && line.includes("\"success\"")) {
              jsonLine = line;
              break;
            }
          }

          if (jsonLine) {
            parsedOut = JSON.parse(jsonLine);
            logger.info("Parsed stdout JSON from line", { parsedOut });
          } else {
            parsedOut = stdout.trim() ? JSON.parse(stdout) : {};
            logger.info("Parsed entire stdout as JSON", { parsedOut });
          }
        } catch (parseError) {
          logger.warn("Failed to parse stdout as JSON", {
            stdout: stdout.substring(0, 500),
            parseError,
          });
          parsedOut = { rawOutput: stdout };
        }

        // Success conditions
        if (parsedOut.success === true) {
          logger.info("CAD engine reported success, ignoring exit code", { exitCode: code });
          return resolve(parsedOut);
        }

        if (parsedOut.outputPath) {
          const fileExists = fs.existsSync(parsedOut.outputPath);
          logger.info("Checking output file existence", {
            outputPath: parsedOut.outputPath,
            fileExists,
            exitCode: code,
          });

          if (fileExists) {
            logger.info("CAD engine created output file, treating as success", {
              outputPath: parsedOut.outputPath,
              exitCode: code,
            });
            parsedOut.success = true;
            return resolve(parsedOut);
          }
        }

        // Failure condition: non-zero exit code with no success indicator
        if (code !== 0) {
          logger.error("CAD engine failed", {
            exitCode: code,
            stderr,
            parsedOut,
            stdoutLength: stdout.length,
            stderrLength: stderr.length,
          });
          return reject(
            new Error(`ScanMaster CAD Engine exited with code ${code}: ${stderr || "No error details"}`),
          );
        }

        // Zero exit code without explicit success -> treat as neutral success
        logger.info("CAD engine completed with zero exit code", { parsedOut });
        resolve(parsedOut);
      });
    });

    const publicStepUrl = `/cad-3d-output/${userId}/${jobId}.step`;

    return res.json({
      stepUrl: publicStepUrl,
      jobId,
      engineResult: pythonResult,
    });
  } catch (error: any) {
    logger.error("Error while generating CAD solid via ScanMaster engine", {
      error: error?.message || String(error),
    });

    return res.status(500).json({
      error: "Failed to generate CAD solid via ScanMaster engine",
    });
  }
});
```

---

## 4. Input Payload Schema

The request body is validated using `zod` with the following schema (`cadSolidJobSchema` in `server/routes.ts`):

```ts
const cadSolidJobSchema = z.object({
  shapeType: z.string(),
  parameters: z.record(z.any()).default({}),
  calibrationData: z
    .object({
      fbhSizes: z.string().optional(),
      metalTravelDistance: z
        .union([z.number(), z.string().transform((val) => Number(val))])
        .optional(),
      blockDimensions: z
        .object({
          L: z.number().min(1, "Block length must be positive"),
          W: z.number().min(1, "Block width must be positive"),
          H: z.number().min(1, "Block height must be positive"),
        })
        .optional(),
      standardType: z.string().optional(),
      material: z.string().optional(),
      partThickness: z
        .union([z.number(), z.string().transform((val) => Number(val))])
        .optional(),
      partType: z.string().optional(),
      isHollow: z.boolean().optional(),
      acceptanceClass: z.string().optional(),
      probeType: z.string().optional(),
      frequency: z
        .union([z.number(), z.string().transform((val) => Number(val))])
        .optional(),
      inspectionType: z.string().optional(),
    })
    .optional(),
  metadata: z
    .object({
      userId: z.string().optional(),
      projectId: z.string().optional(),
      partName: z.string().optional(),
    })
    .optional(),
});
```

If validation fails, the server returns `400 Bad Request` with detailed validation info and does **not** call the CAD engine.

---

## 5. Example Job File Sent to the CAD Engine

Job files are written to `cad-engine-jobs/` and passed to the CLI via `--json <jobFile>`. Here is a real example of a job that was generated:

```json
{
  "jobId": "1763430858942-gy7u52",
  "engine": "ScanMaster CAD Engine v3.0",
  "shapeType": "calibration_block",
  "parameters": {
    "length": 100,
    "width": 50,
    "height": 25
  },
  "calibrationData": {
    "fbhSizes": "2/64, 3/64, 5/64",
    "metalTravelDistance": 25.4,
    "blockDimensions": {
      "L": 100,
      "W": 50,
      "H": 25
    },
    "standardType": "rectangular_block",
    "material": "aluminum",
    "partThickness": 25,
    "partType": "cylinder",
    "isHollow": false,
    "acceptanceClass": "A",
    "probeType": "contact",
    "frequency": 5,
    "inspectionType": "straight_beam"
  },
  "metadata": {
    "userId": "current-user",
    "projectId": "current-project",
    "partName": "Calibration_Block_1763430858598"
  },
  "outputFormat": "step",
  "outputPath": "D:\\Scan-Master-Replit_NEW\\Scan-Master\\cad-3d-output\\current-user\\1763430858942-gy7u52.step"
}
```

The expectation is that the CAD engine will:

1. Read this JSON job file.
2. Generate a 3D solid (STEP) file at the path given in `outputPath`.
3. Optionally print JSON to stdout describing the result.

---

## 6. How the Node.js Server Interprets the CAD Engine Result

### 6.1. Process invocation

The Node server starts the CAD engine as a child process:

```text
<PYTHON_BIN> <SCANMASTER_CAD_SCRIPT> --json <jobFilePath>
```

Example:

```text
D:\ScanMaster_CAD_Engine\venv\Scripts\python.exe \
  D:\ScanMaster_CAD_Engine\scanmaster_cli.py \
  --json D:\Scan-Master-Replit_NEW\Scan-Master\cad-engine-jobs\1763430858942-gy7u52.json
```

### 6.2. Parsing stdout

- The server collects **stdout** and **stderr**.
- It tries to parse the **last line** of stdout that looks like JSON and contains the key `"success"`.
- If that fails, it tries to parse the **entire stdout** as JSON.
- If parsing fails, it treats stdout as plain text and stores it in `parsedOut.rawOutput`.

### 6.3. Success conditions

The server treats the run as **success** if **any** of the following is true:

1. `parsedOut.success === true` (explicit JSON success flag), regardless of exit code.
2. `parsedOut.outputPath` exists on disk (`fs.existsSync(parsedOut.outputPath)`), in which case it sets `parsedOut.success = true` and resolves.

If neither condition is met and `exitCode !== 0`, the server logs:

```text
CAD engine failed
```

with details (exit code, stdout length, stderr text), rejects the Promise, and returns HTTP 500 to the client.

If `exitCode === 0` but there is no explicit success, the server still resolves with `parsedOut`, but this is **not** what happens in the failing cases described here: in the failing cases, the exit code is non-zero.

---

## 7. Observed Behavior (The Problem)

From the logs and behavior:

- The CAD engine process (`scanmaster_cli.py`) finishes with a **non‑zero exit code**.
- The server does **not** see `parsedOut.success === true` in stdout.
- The server does **not** see a STEP file at `parsedOut.outputPath` (if `outputPath` is present at all in stdout).
- Therefore, the server logs `CAD engine failed` and then returns HTTP 500 with:

  ```json
  {"error": "Failed to generate CAD solid via ScanMaster engine"}
  ```

Additionally, the monitoring middleware reports that requests to `/api/cad/engine/parts` sometimes take ~3.5 seconds before failing:

```text
Slow request detected: POST /api/cad/engine/parts took 3495.20ms
```

This suggests that the Python engine is doing some work, then failing.

---

## 8. What We Need From the CAD Engine Side

To diagnose and fix the issue, we need help from the CAD engine maintainers.

### 8.1. Clarify why exit code is non‑zero

For jobs like the example above, the Python CLI (`scanmaster_cli.py`) is returning an exit code ≠ 0. We need to know:

- What exception or error condition is occurring?
- Is the problem related to:
  - Unsupported `shapeType`?
  - Invalid or missing parameters?
  - FreeCAD configuration (`FREECAD_PATH`, template path, etc.)?
  - File system permissions or invalid paths?

The server already logs `stderr` from the process. The clearest way to investigate is to run the CLI directly with the same JSON file:

```text
D:\ScanMaster_CAD_Engine\venv\Scripts\python.exe \
  D:\ScanMaster_CAD_Engine\scanmaster_cli.py \
  --json D:\Scan-Master-Replit_NEW\Scan-Master\cad-engine-jobs\1763430858942-gy7u52.json
```

and inspect the printed error.

A helper script `debug-spawn.mjs` exists in the repo to do exactly this and show `stdout` and `stderr` for any job file.

### 8.2. Standardize success output

To make the integration robust, we propose the following conventions:

1. **On success**, the CLI should:
   - Exit with `exitCode == 0`.
   - Ensure the STEP file actually exists at the path indicated in the job's `outputPath`.
   - Print a final line to stdout containing JSON with `success: true`, for example:

     ```json
     {
       "success": true,
       "outputPath": "D:\\Scan-Master-Replit_NEW\\Scan-Master\\cad-3d-output\\current-user\\1763430858942-gy7u52.step",
       "executionTime": 0.42,
       "message": "STEP file generated successfully",
       "partInfo": {
         "originalShapeType": "calibration_block",
         "cadEngineType": "ScanMaster CAD Engine v3.0",
         "hasDrilledHoles": true,
         "holesCount": 12,
         "fileSize": 20480
       }
     }
     ```

   - This line should be printed **after** any progress/log messages, so our parser can easily find it.

2. **On failure**, the CLI should:
   - Exit with `exitCode != 0`.
   - Write a clear error message to `stderr` (exception message, stack trace, or at least a human-readable description).
   - Optionally print a JSON object with `success: false` and `error` message to stdout.

The Node.js code already supports both patterns.

### 8.3. Supported `shapeType` values

On the frontend side, various shapes are used, for example (from `src/pages/TechnicalDrawingTest.tsx` and calibration components):

- `"calibration_block"`
- `"flat_block"`
- `"fbh_block"`
- `"test_block"`
- plus some experimental shapes like `"ring"`, `"disk"`, `"tube"`, `"rectangular_tube"`, `"pyramid"`, `"ellipse"`, etc.

We need from the CAD engine team:

- A definitive list of supported `shapeType` values for the current version of the CLI.
- For unsupported `shapeType` values, the desired behavior (e.g. exit with non-zero code and a clear error message).

Once we have this list, we can:

- Update frontend validation.
- Restrict `shapeType` to supported values.
- Avoid sending jobs that will always fail.

---

## 9. Summary

- The Node.js integration with ScanMaster CAD Engine v3.0 is implemented and working **up to** the point of starting the Python CLI process.
- The errors observed (`CAD engine failed`, HTTP 500) are due to the **Python process exiting with a non‑zero exit code** and not providing a clear success indication.
- We have provided:
  - The exact invocation format used by the server.
  - The input job JSON format.
  - The logic used by the Node.js server to interpret the result.

**Action items for the CAD engine / Python side:**

1. Run the CLI locally with one of the job files under `cad-engine-jobs/` (e.g. the example above) and identify the root cause of the non‑zero exit code.
2. Adjust the CLI to:
   - Return `exitCode = 0` and/or `success: true` JSON on success.
   - Return `exitCode != 0` with clear `stderr`/JSON on failure.
3. Provide a list of supported `shapeType` values and requirements for `parameters` and `calibrationData`.

Once these points are clarified and implemented, the Node.js server will be able to distinguish reliably between success and failure and return proper HTTP responses and STEP URLs to the client.