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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onPhotoSelected(file);
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
              <input type="file" accept="image/*" onChange={handleFileChange} />
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
