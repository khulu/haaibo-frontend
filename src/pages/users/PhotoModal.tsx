import { useRef, useState } from "react";
import Webcam from "react-webcam";
import Button from "../../components/ui/button/Button";
import { Modal } from "../../components/ui/modal";

interface PhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoSelected: (file: File | Blob) => void;
}

const videoConstraints = {
  width: 320,
  height: 240,
  facingMode: "user",
};

export default function PhotoModal({ isOpen, onClose, onPhotoSelected }: PhotoModalProps) {
  const [mode, setMode] = useState<"options" | "upload" | "webcam">("options");
  const webcamRef = useRef<Webcam>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;
    const maxBytes = 5 * 1024 * 1024;
    const allowedMime = ["image/jpeg", "image/png", "image/svg+xml"];
    const allowedExt = [".jpg", ".jpeg", ".png", ".svg"];
    const hasValidSize = file.size <= maxBytes;
    const nameLower = file.name.toLowerCase();
    const hasValidExt = allowedExt.some((ext) => nameLower.endsWith(ext));
    const hasValidType = allowedMime.includes(file.type);
    if (!hasValidSize || !hasValidExt || !hasValidType) {
      setUploadError("Invalid file. Allowed: .jpg, .jpeg, .png, .svg. Max 5MB.");
      return;
    }
    onPhotoSelected(file);
  };

  const capture = () => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      fetch(imageSrc)
        .then(res => res.blob())
        .then(blob => onPhotoSelected(blob));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[700px] m-4">
      <div className="relative w-full p-4 overflow-y-auto bg-white no-scrollbar rounded-3xl dark:bg-gray-900 lg:p-11">
        <div className="px-2 pr-14">
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
            Update Profile Photo
          </h4>
          <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Choose to upload a photo or take a new one with your webcam.
          </p>
        </div>
        <div className="flex flex-col gap-4 items-center">
          {mode === "options" && (
            <>
              <Button onClick={() => setMode("upload")}>Upload Photo</Button>
              <Button onClick={() => setMode("webcam")}>Take Photo</Button>
            </>
          )}
          {mode === "upload" && (
            <div className="flex flex-col gap-4 w-full items-center">
              <input type="file" accept=".jpg,.jpeg,.png,.svg" onChange={handleFileChange} />
              {uploadError && <div className="text-red-500 text-sm">{uploadError}</div>}
              <Button onClick={() => setMode("options")}>Back</Button>
            </div>
          )}
          {mode === "webcam" && (
            <div className="flex flex-col gap-4 items-center">
              <Webcam
                audio={false}
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="rounded-lg border border-gray-200"
              />
              <Button onClick={capture}>Capture</Button>
              <Button onClick={() => setMode("options")}>Back</Button>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
