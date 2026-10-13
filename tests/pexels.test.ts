import { test } from "node:test";
import assert from "node:assert/strict";
import { mixVideos, pickFile } from "../lib/pexels";

const f = (width: number, height: number, link: string, file_type = "video/mp4") => ({ file_type, width, height, link });

test("picks the biggest landscape MP4 that is still Full HD or smaller", () => {
  const link = pickFile({ duration: 12, video_files: [f(640, 360, "https://v/sd.mp4"), f(1920, 1080, "https://v/hd.mp4"), f(3840, 2160, "https://v/4k.mp4"), f(1080, 1920, "https://v/portrait.mp4")] });
  assert.equal(link, "https://v/hd.mp4");
});

test("skips long clips, non-MP4 files and non-https links", () => {
  assert.equal(pickFile({ duration: 300, video_files: [f(1920, 1080, "https://v/a.mp4")] }), "");
  assert.equal(pickFile({ duration: 10, video_files: [f(1920, 1080, "https://v/a.m3u8", "application/x-mpegURL")] }), "");
  assert.equal(pickFile({ duration: 10, video_files: [f(1920, 1080, "http://v/a.mp4")] }), "");
});

test("mixes several searches, removes duplicates and caps the list", () => {
  const mk = (...links: string[]) => ({ videos: links.map((l) => ({ duration: 10, video_files: [f(1920, 1080, l)] })) });
  const out = mixVideos([mk("https://v/1", "https://v/2"), mk("https://v/3", "https://v/1"), null, "junk"], 3);
  assert.deepEqual(out, ["https://v/1", "https://v/3", "https://v/2"]);
});
