import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ImageUploader } from "./ImageUploader";

describe("ImageUploader Component", () => {
  it("renders both Upload Image and Use Image URL toggle buttons", () => {
    const onChange = vi.fn();
    render(<ImageUploader label="Product photo" onChange={onChange} />);

    expect(screen.getByText("Product photo")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload image/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /use image url/i })).toBeInTheDocument();
  });

  it("switches to URL mode and renders input", () => {
    const onChange = vi.fn();
    render(<ImageUploader onChange={onChange} />);

    const urlTab = screen.getByRole("button", { name: /use image url/i });
    fireEvent.click(urlTab);

    expect(screen.getByPlaceholderText(/https:\/\/images\.unsplash\.com/i)).toBeInTheDocument();
  });

  it("displays uploaded image preview when value is provided", () => {
    const onChange = vi.fn();
    render(
      <ImageUploader
        value="https://example.com/mirchi.jpg"
        onChange={onChange}
      />
    );

    expect(screen.getByAltText("Preview")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /change image/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /remove/i })).toBeInTheDocument();
  });

  it("clears image when remove button is clicked", () => {
    const onChange = vi.fn();
    render(
      <ImageUploader
        value="https://example.com/mirchi.jpg"
        onChange={onChange}
      />
    );

    const removeBtn = screen.getByRole("button", { name: /remove/i });
    fireEvent.click(removeBtn);

    expect(onChange).toHaveBeenCalledWith("");
  });
});

