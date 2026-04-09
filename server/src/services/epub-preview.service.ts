import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import unzipper from "unzipper";

const EPUB_PREVIEW_ROOT = path.resolve(process.cwd(), "storage", "epub-previews");

const ensurePreviewRoot = async () => {
  await fs.mkdir(EPUB_PREVIEW_ROOT, { recursive: true });
};

const normalizeArchivePath = (entryPath: string) => {
  const normalized = path.posix.normalize(entryPath.replace(/\\/g, "/"));

  if (
    normalized.startsWith("../") ||
    normalized === ".." ||
    path.posix.isAbsolute(normalized)
  ) {
    throw new Error(`Unsafe EPUB entry path: ${entryPath}`);
  }

  return normalized;
};

const resolveContainerPackagePath = (containerXml: string) => {
  const match = containerXml.match(/full-path\s*=\s*"([^"]+)"/i);
  return match?.[1] ? normalizeArchivePath(match[1]) : null;
};

export const extractEpubPreview = async (
  buffer: Buffer,
): Promise<{ previewDir: string; packagePath: string }> => {
  await ensurePreviewRoot();

  const previewDir = randomUUID();
  const destinationRoot = path.join(EPUB_PREVIEW_ROOT, previewDir);
  await fs.mkdir(destinationRoot, { recursive: true });

  try {
    const archive = await unzipper.Open.buffer(buffer);
    let containerXml: string | null = null;
    let fallbackPackagePath: string | null = null;

    for (const entry of archive.files) {
      const normalizedPath = normalizeArchivePath(entry.path);

      if (!normalizedPath || normalizedPath.endsWith("/")) {
        continue;
      }

      const destinationPath = path.resolve(destinationRoot, normalizedPath);
      if (
        destinationPath !== destinationRoot &&
        !destinationPath.startsWith(`${destinationRoot}${path.sep}`)
      ) {
        throw new Error(`Unsafe EPUB destination path: ${entry.path}`);
      }

      await fs.mkdir(path.dirname(destinationPath), { recursive: true });
      const fileBuffer = await entry.buffer();
      await fs.writeFile(destinationPath, fileBuffer);

      if (normalizedPath === "META-INF/container.xml") {
        containerXml = fileBuffer.toString("utf8");
      }

      if (!fallbackPackagePath && normalizedPath.toLowerCase().endsWith(".opf")) {
        fallbackPackagePath = normalizedPath;
      }
    }

    const packagePath =
      (containerXml && resolveContainerPackagePath(containerXml)) ||
      fallbackPackagePath;

    if (!packagePath) {
      throw new Error("EPUB package.opf not found");
    }

    return { previewDir, packagePath };
  } catch (error) {
    await fs.rm(destinationRoot, { recursive: true, force: true });
    throw error;
  }
};

export const removeEpubPreview = async (previewDir?: string | null) => {
  if (!previewDir) return;

  await ensurePreviewRoot();
  const destinationRoot = path.resolve(EPUB_PREVIEW_ROOT, previewDir);

  if (
    destinationRoot === EPUB_PREVIEW_ROOT ||
    !destinationRoot.startsWith(`${EPUB_PREVIEW_ROOT}${path.sep}`)
  ) {
    throw new Error("Unsafe EPUB preview directory");
  }

  await fs.rm(destinationRoot, { recursive: true, force: true });
};

export const resolveEpubPreviewPath = (
  previewDir: string,
  assetPath: string,
): string => {
  const normalizedAssetPath = normalizeArchivePath(assetPath);
  const previewRoot = path.resolve(EPUB_PREVIEW_ROOT, previewDir);
  const resolvedPath = path.resolve(previewRoot, normalizedAssetPath);

  if (
    resolvedPath !== previewRoot &&
    !resolvedPath.startsWith(`${previewRoot}${path.sep}`)
  ) {
    throw new Error("Unsafe EPUB asset path");
  }

  return resolvedPath;
};
