from __future__ import annotations

import argparse
import base64
import html
import json
import re
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import requests
from docx import Document


API_SAVE_URL = "https://jhatpatai.bizskilledu.com/backend/api/save-content.php"
API_UPLOAD_URL = "https://jhatpatai.bizskilledu.com/backend/api/upload-image.php"

COURSE_ROOT_DEFAULT = Path(r"D:\GST for the Layman")

VIDEO_URL_RE = re.compile(
    r"(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})"
)
TAG_RE = re.compile(r"<[^>]+>")


@dataclass
class LessonItem:
    section_name: str
    title: str
    slug: str
    path: Path
    order_no: int
    thumbnail_path: Path | None


def create_slug(text: str) -> str:
    text = text.strip().lower()
    text = re.sub(r"\s+", "-", text)
    text = re.sub(r"[^\w\-]+", "", text)
    text = re.sub(r"\-+", "-", text)
    return text.strip("-")


def choose_course_folder(initial_dir: Path | None = None) -> Path:
    initial_dir = initial_dir or COURSE_ROOT_DEFAULT.parent
    try:
        import tkinter as tk
        from tkinter import filedialog

        root = tk.Tk()
        root.withdraw()
        selected = filedialog.askdirectory(
            title="Select Course Folder",
            initialdir=str(initial_dir),
        )
        root.destroy()
        if selected:
            return Path(selected)
    except Exception:
        pass

    entered = input(f"Enter course folder path [{initial_dir}]: ").strip()
    return Path(entered or initial_dir)


def remove_alpha_prefix(text: str) -> str:
    return re.sub(r"^[A-Z]\.\s*", "", text).strip()


def html_escape(text: str) -> str:
    return html.escape(text, quote=True)


def detect_youtube(html_text: str) -> str:
    return VIDEO_URL_RE.sub(
        lambda match: (
            '<div class="video-container">'
            f'<iframe width="560" height="315" src="https://www.youtube.com/embed/{match.group(1)}" '
            'frameborder="0" allowfullscreen></iframe>'
            "</div>"
        ),
        html_text,
    )


def clean_html_tags(html_text: str, title: str | None = None) -> str:
    html_text = re.sub(r'style="[^"]*"', "", html_text)
    html_text = re.sub(r'class="[^"]*"', "", html_text)
    html_text = re.sub(r'id="[^"]*"', "", html_text)
    html_text = re.sub(r"\n{3,}", "\n\n", html_text).strip()

    if title:
        first_tag_re = re.compile(r"^\s*<([a-z1-6]+)[^>]*>([\s\S]*?)</\1>", re.I)
        match = first_tag_re.match(html_text)
        if match:
            first_tag_text = TAG_RE.sub("", match.group(2)).replace("&nbsp;", " ").strip()
            if first_tag_text.lower() == title.strip().lower():
                html_text = html_text[match.end() :].strip()

    return html_text


def image_to_data_uri(path: Path) -> str:
    ext = path.suffix.lower().lstrip(".")
    mime = {
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "gif": "image/gif",
        "webp": "image/webp",
    }.get(ext, "application/octet-stream")
    encoded = base64.b64encode(path.read_bytes()).decode("ascii")
    return f"data:{mime};base64,{encoded}"


def upload_image(session: requests.Session, image_path: Path, folder: str, file_name: str) -> str:
    payload = {
        "image": image_to_data_uri(image_path),
        "folder": folder,
        "fileName": file_name,
    }
    response = session.post(API_UPLOAD_URL, data={"json_data": json.dumps(payload)}, timeout=60)
    response.raise_for_status()
    data = response.json()
    if data.get("status") != "success":
        raise RuntimeError(f"Image upload failed for {image_path.name}: {data}")
    return data["url"]


def extract_docx_images(docx_path: Path, temp_dir: Path) -> list[Path]:
    image_paths: list[Path] = []
    with zipfile.ZipFile(docx_path) as archive:
        media_names = [name for name in archive.namelist() if name.startswith("word/media/")]
        for index, media_name in enumerate(media_names, start=1):
            ext = Path(media_name).suffix.lower() or ".png"
            out_path = temp_dir / f"{docx_path.stem}-{index}{ext}"
            out_path.write_bytes(archive.read(media_name))
            image_paths.append(out_path)
    return image_paths


def convert_docx_to_html(docx_path: Path, title: str, embedded_image_urls: Iterable[str]) -> str:
    document = Document(docx_path)
    parts: list[str] = []
    list_open = False

    def close_list() -> None:
        nonlocal list_open
        if list_open:
            parts.append("</ul>")
            list_open = False

    for paragraph in document.paragraphs:
        text = paragraph.text.strip()
        if not text:
            close_list()
            continue

        style_name = paragraph.style.name if paragraph.style is not None else ""
        escaped = html_escape(text)

        if style_name.startswith("Heading 1"):
            close_list()
            parts.append(f"<h1>{escaped}</h1>")
        elif style_name.startswith("Heading 2"):
            close_list()
            parts.append(f"<h2>{escaped}</h2>")
        elif style_name.startswith("Heading 3"):
            close_list()
            parts.append(f"<h3>{escaped}</h3>")
        elif style_name.lower().startswith("list") or re.match(r"^[\u2022\-]\s+", text):
            if not list_open:
                parts.append("<ul>")
                list_open = True
            item_text = re.sub(r"^[\u2022\-]\s+", "", escaped)
            parts.append(f"<li>{item_text}</li>")
        else:
            close_list()
            paragraph_html = escaped.replace("\n", "<br>")
            parts.append(f"<p>{paragraph_html}</p>")

    close_list()

    for image_url in embedded_image_urls:
        parts.append(f'<p><img src="{html_escape(image_url)}" alt="{html_escape(title)}"></p>')

    html_text = "\n".join(parts)
    html_text = detect_youtube(html_text)
    return clean_html_tags(html_text, title=title)


def featured_image_map(course_root: Path) -> dict[str, Path]:
    image_dir = course_root / "Ignore" / "featured_images"
    mapping: dict[str, Path] = {}
    if not image_dir.exists():
        return mapping

    for path in sorted(image_dir.glob("*.png")):
        if path.name.startswith("test-"):
            continue
        cleaned = re.sub(r"^\d+\.\s*", "", path.stem).strip()
        mapping[cleaned.lower()] = path
    return mapping


def build_lessons(course_root: Path) -> list[LessonItem]:
    images = featured_image_map(course_root)
    lessons: list[LessonItem] = []
    lesson_order = 1

    section_dirs = [p for p in sorted(course_root.iterdir()) if p.is_dir() and p.name != "Ignore"]
    for section_dir in section_dirs:
        section_name = remove_alpha_prefix(section_dir.name)
        for lesson_path in sorted(section_dir.glob("*.docx")):
            title = remove_alpha_prefix(lesson_path.stem)
            lessons.append(
                LessonItem(
                    section_name=section_name,
                    title=title,
                    slug=create_slug(title),
                    path=lesson_path,
                    order_no=lesson_order,
                    thumbnail_path=images.get(title.lower()),
                )
            )
            lesson_order += 1
    return lessons


def post_content(session: requests.Session, payload: dict) -> dict:
    response = session.post(API_SAVE_URL, data={"json_data": json.dumps(payload)}, timeout=60)
    response.raise_for_status()
    data = response.json()
    if data.get("status") != "success":
        raise RuntimeError(f"Publish failed for {payload.get('slug')}: {data}")
    return data


def publish_course(course_root: Path, category: str, access_type: str, dry_run: bool) -> None:
    if not course_root.exists():
        raise FileNotFoundError(f"Course root not found: {course_root}")

    course_title = course_root.name
    course_slug = create_slug(course_title)
    intro_path = course_root / "Introduction.docx"
    if not intro_path.exists():
        raise FileNotFoundError(f"Missing Introduction.docx in {course_root}")

    ignore_dir = course_root / "Ignore"
    temp_dir = Path.cwd() / ".publish_tmp"
    temp_dir.mkdir(exist_ok=True)

    session = requests.Session()
    lessons = build_lessons(course_root)

    try:
        course_thumb_path = ignore_dir / "thumbnail.png"
        course_thumb_url = None
        if course_thumb_path.exists():
            course_thumb_url = "(dry-run)"
            if not dry_run:
                course_thumb_url = upload_image(
                    session,
                    course_thumb_path,
                    f"course/{course_slug}",
                    "thumb.png",
                )

        intro_embedded_paths = extract_docx_images(intro_path, temp_dir)
        intro_embedded_urls: list[str] = []
        for index, image_path in enumerate(intro_embedded_paths, start=1):
            if dry_run:
                intro_embedded_urls.append(f"(dry-run)/course/{course_slug}/intro-{index}{image_path.suffix.lower()}")
            else:
                intro_embedded_urls.append(
                    upload_image(
                        session,
                        image_path,
                        f"course/{course_slug}",
                        f"intro-{index}{image_path.suffix.lower()}",
                    )
                )

        course_html = convert_docx_to_html(intro_path, "Introduction", intro_embedded_urls)
        course_payload = {
            "type": "course",
            "title": course_title,
            "slug": course_slug,
            "thumbnail": course_thumb_url,
            "html_content": course_html,
            "category": category,
            "status": "sync",
        }

        print(f"Course: {course_title} ({course_slug})")
        if dry_run:
            print("Dry run: course payload ready")
        else:
            post_content(session, course_payload)
            print("Published course")

        for lesson in lessons:
            embedded_paths = extract_docx_images(lesson.path, temp_dir)
            embedded_urls: list[str] = []
            for index, image_path in enumerate(embedded_paths, start=1):
                if dry_run:
                    embedded_urls.append(
                        f"(dry-run)/lesson/{lesson.slug}/img-{index}{image_path.suffix.lower()}"
                    )
                else:
                    embedded_urls.append(
                        upload_image(
                            session,
                            image_path,
                            f"lesson/{lesson.slug}",
                            f"img-{index}{image_path.suffix.lower()}",
                        )
                    )

            lesson_thumb_url = None
            if lesson.thumbnail_path and lesson.thumbnail_path.exists():
                if dry_run:
                    lesson_thumb_url = f"(dry-run)/lesson/{lesson.slug}/thumb{lesson.thumbnail_path.suffix.lower()}"
                else:
                    lesson_thumb_url = upload_image(
                        session,
                        lesson.thumbnail_path,
                        f"lesson/{lesson.slug}",
                        f"thumb{lesson.thumbnail_path.suffix.lower()}",
                    )

            lesson_html = convert_docx_to_html(lesson.path, lesson.title, embedded_urls)
            payload = {
                "type": "lesson",
                "course_slug": course_slug,
                "section_name": lesson.section_name,
                "title": lesson.title,
                "slug": lesson.slug,
                "thumbnail": lesson_thumb_url,
                "html_content": lesson_html,
                "access_type": access_type,
                "order_no": lesson.order_no,
                "category": category,
                "status": "sync",
            }

            print(f"Lesson {lesson.order_no:02d}: {lesson.section_name} -> {lesson.title}")
            if dry_run:
                continue
            post_content(session, payload)

        print("Done")
    finally:
        for path in temp_dir.glob("*"):
            path.unlink(missing_ok=True)
        temp_dir.rmdir()


def main() -> None:
    parser = argparse.ArgumentParser(description="Publish a local JhatPatAI course folder to the live API.")
    parser.add_argument("--course-root", type=Path)
    parser.add_argument("--category", default="GST")
    parser.add_argument("--access-type", default="free")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--choose-folder", action="store_true")
    args = parser.parse_args()

    course_root = args.course_root
    if args.choose_folder or course_root is None:
        course_root = choose_course_folder()
    if course_root is None:
        raise RuntimeError("No course folder selected.")

    publish_course(
        course_root=course_root,
        category=args.category,
        access_type=args.access_type,
        dry_run=args.dry_run,
    )


if __name__ == "__main__":
    main()
