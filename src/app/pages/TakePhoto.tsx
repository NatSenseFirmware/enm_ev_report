import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  Camera,
  ArrowLeft,
  Check,
  Download,
  ChevronLeft,
  ChevronRight,
  SkipForward,
  Image,
  List,
  Info,
  Settings,
  AlertCircle,
} from "lucide-react";
import JSZip from "jszip";
import * as XLSX from "xlsx";
import { Drawer } from "vaul";

// IndexedDB configuration
const DB_NAME = "InspectionPhotoDB";
const DB_VERSION = 1;
const STORE_NAME = "photos";

const resolveGuideImageUrl = (guideImagePath: string) => {
  const prefix = "src/public/";
  if (!guideImagePath.startsWith(prefix)) {
    return guideImagePath;
  }

  const fileName = guideImagePath.slice(prefix.length);
  return `${import.meta.env.BASE_URL}${fileName}`;
};

// Toggle to require all steps completion before export
const REQUIRE_ALL_STEPS = false; // Set to true to require all steps to be completed

const PHOTO_STEPS = [
  // session_7.2_EnergyConvSys (photos 1-3)
  {
    id: 1,
    name: "能源轉換系統 - 照片1",
    folder: "session_7.2_EnergyConvSys",
    guidance:
      "拍攝能源轉換系統的銘牌或標籤，確保文字清晰",
    guideImage: "src/public/converter_label.jpeg"
  },
  {
    id: 2,
    name: "能源轉換系統 - 照片2",
    folder: "session_7.2_EnergyConvSys",
    guidance:
      "拍攝能源轉換系統的條碼和編號，確保文字清晰",
    guideImage: "src/public/converter_barcode.jpeg"
  },
  {
    id: 3,
    name: "能源轉換系統 - 照片3",
    folder: "session_7.2_EnergyConvSys",
    guidance: "拍攝能源轉換系統的側面照片，展示連接點和接線情況",
    guideImage: "src/public/converter_overall.jpeg"
  },

  // session_7.2_HVCable (photo 4)
  {
    id: 4,
    name: "高壓電纜",
    folder: "session_7.2_HVCable",
    guidance:
      "拍攝高壓電纜的整體布線情況，包括電纜路徑和固定方式",
    guideImage: "src/public/hvcable.jpeg"
  },

  // session_7.2_HVConn (photos 5-7)
  {
    id: 5,
    name: "高壓連接器 - 照片1",
    folder: "session_7.2_HVConn",
    guidance: "拍攝高壓連接器的正面特寫，確保清晰展示連接器的連接狀態",
    guideImage: "src/public/hv_conn_1.jpeg"
  },
  {
    id: 6,
    name: "高壓連接器 - 照片2",
    folder: "session_7.2_HVConn",
    guidance: "拍攝高壓連接器的連接頭1特寫，確保清晰展示連接頭的狀態和標識",
    guideImage: "src/public/hv_conn_2.jpeg"
  },
  {
    id: 7,
    name: "高壓連接器 - 照片3",
    folder: "session_7.2_HVConn",
    guidance: "拍攝高壓連接器的連接頭2特寫，確保清晰展示連接頭的狀態和標識",
    guideImage: "src/public/hv_conn_3.jpeg"
  },

  // session_7.2_HVTerminal (photos 8-10)
  {
    id: 8,
    name: "高壓端子 - 照片1",
    folder: "session_7.2_HVTerminal",
    guidance: "拍攝高壓端子的頂部照片，展示端子本體和連接狀態",
    guideImage: "src/public/hv_terminal_1.jpeg"
  },
  {
    id: 9,
    name: "高壓端子 - 照片2",
    folder: "session_7.2_HVTerminal",
    guidance: "拍攝高壓端子的側面照片，展示端子連接情況",
    guideImage: "src/public/hv_terminal_2.jpeg"
  },
  {
    id: 10,
    name: "高壓端子 - 照片3",
    folder: "session_7.2_HVTerminal",
    guidance: "拍攝高壓端子和車頭蓋板的相對位置，展示端子布置和固定方式",
    guideImage: "src/public/hv_terminal_3.jpeg"
  },

  // session_7.2_RESS (photos 11-13)
  {
    id: 11,
    name: "可充電儲能系統 - 照片1",
    folder: "session_7.2_RESS",
    guidance: "拍攝RESS的整體安裝位置和外觀",
    guideImage: "src/public/RESS1.jpeg"
  },
  {
    id: 12,
    name: "可充電儲能系統 - 照片2",
    folder: "session_7.2_RESS",
    guidance: "拍攝RESS的銘牌，包括容量、電壓等規格信息",
    guideImage: "src/public/RESS2.jpeg"
  },
  {
    id: 13,
    name: "可充電儲能系統 - 照片3",
    folder: "session_7.2_RESS",
    guidance: "拍攝RESS的主要連接點和安全裝置",
    guideImage: "src/public/RESS3.jpeg"
  },

  // session_7.2_Trac_sys (photos 14-16)
  {
    id: 14,
    name: "牽引系統 - 照片1",
    folder: "session_7.2_Trac_sys",
    guidance: "拍攝驅動系統的整體外觀和安裝位置的電氣連接和冷卻系統",
    guideImage: "src/public/trac1.jpeg"
  },
  {
    id: 15,
    name: "牽引系統 - 照片2",
    folder: "session_7.2_Trac_sys",
    guidance: "拍攝牽引系統的銘牌和型號信息",
    guideImage: "src/public/trac2.jpeg"
  },
  // {
  //   id: 16,
  //   name: "牽引系統 - 照片3",
  //   folder: "session_7.2_Trac_sys",
  //   guidance: "拍攝牽引系統的銘牌和型號信息，必須清晰展示文字和標籤",
  //   guideImage: "src/public/trac3.jpg"
  // },

  // session_7.2_VehicleInlet (photos 17-18)
  {
    id: 17,
    name: "車輛插座 - 照片1",
    folder: "session_7.2_VehicleInlet",
    guidance: "拍攝充電插座內部的插座結構和接點，確保清晰展示插座的類型和狀態",
    guideImage: "src/public/vehicle_inlet1.jpeg"
  },
  {
    id: 18,
    name: "車輛插座 - 照片2",
    folder: "session_7.2_VehicleInlet",
    guidance: "拍攝充電插座的外觀和位置，包括防護蓋",
    guideImage: "src/public/vehicle_inlet2.jpeg"
  },

  // session_7.4 (photos 19-40)
  {
    id: 19,
    name: "車輛整體外觀-正面",
    folder: "session_7.4",
    guidance: "拍攝車輛整體外觀的正面照片，展示車頭和前輪位置",
    guideImage: "src/public/frontview.jpeg"
  },
  {
    id: 20,
    name: "車輛整體外觀-背面",
    folder: "session_7.4",
    guidance: "拍攝車輛整體外觀的背面照片，展示車尾和後輪位置",
    guideImage: "src/public/backview.jpeg"
  },
  {
    id: 21,
    name: "車輛整體外觀-右側1",
    folder: "session_7.4",
    guidance: "拍攝車輛整體外觀的右前方照片，展示車身側面和車輪位置",
    guideImage: "src/public/right1.jpeg"
  },
  {
    id: 22,
    name: "車輛整體外觀-右側2",
    folder: "session_7.4",
    guidance: "拍攝車輛整體外觀的右後方照片，展示車身側面和車輪位置",
    guideImage: "src/public/right2.jpeg"
  },
  {
    id: 23,
    name: "車輛整體外觀-左側1",
    folder: "session_7.4",
    guidance: "拍攝車輛整體外觀的左前方照片，展示車身側面和車輪位置",
    guideImage: "src/public/left1.jpeg"
  },
  {
    id: 24,
    name: "車輛整體外觀-左側2",
    folder: "session_7.4",
    guidance: "拍攝車輛整體外觀的左後方照片，展示車身側面和車輪位置",
    guideImage: "src/public/left2.jpeg"
  },
  {
    id: 25,
    name: "車輛充電口外側防護蓋",
    folder: "session_7.4",
    guidance: "拍攝車輛充電口的外側防護蓋，確保清晰展示防護蓋的狀態和位置",
    guideImage: "src/public/coverlid.jpeg"
  },
  {
    id: 26,
    name: "車輛充電口內部連接點AC DC插頭",
    folder: "session_7.4",
    guidance: "拍攝車輛充電口的內部連接點，確保清晰展示連接點的狀態和位置",//src/public/vehicle_inlet2.jpeg
    guideImage: "src/public/vehicle_inlet1.jpeg"
  },
  {
    id: 27,
    name: "車輛充電口內部防護蓋",
    folder: "session_7.4",
    guidance: "拍攝車輛充電口的內部防護蓋，確保清晰展示防護蓋的狀態和位置",//src/public/vehicle_inlet2.jpeg
    guideImage: "src/public/vehicle_inlet2.jpeg"
  },
  {
    id: 28,
    name: "外接充電線連接器",
    folder: "session_7.4",
    guidance: "拍攝外接充電線的連接器，確保清晰展示連接器的狀態和位置",
    guideImage: "src/public/extcharge.jpg"
  },
  {
    id: 29,
    name: "外接充電線連接線",
    folder: "session_7.4",
    guidance: "拍攝外接充電線的連接線，確保清晰展示連接線的狀態和位置",
    guideImage: "src/public/wire.jpg"
  },
  {
    id: 30,
    name: "外接充電線連接線插頭",
    folder: "session_7.4",
    guidance: "拍攝外接充電線的連接線插頭，確保清晰展示插頭的狀態和位置",
    guideImage: "src/public/plug.jpg"
  },
  {
    id: 31,
    name: "控制器（ICCB）",
    folder: "session_7.4",
    guidance: "拍攝控制器（ICCB）的整體外觀，確保清晰展示控制器的狀態和位置",
    guideImage: "src/public/iccb.jpg"
  },
  {
    id: 32,
    name: "控制器（ICCB）標籤",
    folder: "session_7.4",
    guidance: "拍攝控制器（ICCB）的標籤，確保清晰展示標籤的狀態和信息",
    guideImage: "src/public/iccb_label.png"
  },
  {
    id: 33,
    name: "電動車底盤號碼",
    folder: "session_7.4",
    guidance: "拍攝電動車底盤號碼，確保清晰展示底盤號碼的位置和狀態",
    guideImage: "src/public/chassis_no.jpeg"
  },
  {
    id: 34,
    name: "電動車底盤號碼標籤",
    folder: "session_7.4",
    guidance: "拍攝電動車底盤號碼的標籤，確保清晰展示標籤的狀態和信息",
    guideImage: "src/public/chassis_label.jpeg"
  },
  {
    id: 35,
    name: "電動車標籤信息",
    folder: "session_7.4",
    guidance: "拍攝電動車標籤信息，確保清晰展示標籤的狀態和信息",//ress2.jpeg
    guideImage: "src/public/RESS2.jpeg"
  },
  // {
  //   id: 36,
  //   name: "絕緣電阻測試 - 照片18",
  //   folder: "session_7.4",
  //   guidance: "拍攝測試環境溫度和濕度記錄",//none
  // },
  {
    id: 36,
    name: "電動車品牌商標",
    folder: "session_7.4",
    guidance: "拍攝電動車品牌商標，確保清晰展示商標",
    guideImage: "src/public/logo.jpeg"
  },
  {
    id: 37,
    name: "電動車車型",
    folder: "session_7.4",
    guidance: "拍攝電動車車型，確保清晰展示車型信息",
    guideImage: "src/public/model.jpeg"
  },
  
];

const GUIDE_IMAGE_URLS = Array.from(
  new Set(PHOTO_STEPS.map((step) => resolveGuideImageUrl(step.guideImage))),
);

const SHARED_PHOTO_STEP_ID_PAIRS: Array<[number, number]> = [
  [10, 3],
  [5, 13],
  [17, 26],
  [18, 27],
];

const STEP_ID_TO_INDEX = PHOTO_STEPS.reduce<Record<number, number>>(
  (acc, step, index) => {
    acc[step.id] = index;
    return acc;
  },
  {},
);

const SHARED_PHOTO_INDEX_MAP = SHARED_PHOTO_STEP_ID_PAIRS.reduce<
  Record<number, number>
>((acc, [stepIdA, stepIdB]) => {
  const indexA = STEP_ID_TO_INDEX[stepIdA];
  const indexB = STEP_ID_TO_INDEX[stepIdB];

  if (indexA !== undefined && indexB !== undefined) {
    acc[indexA] = indexB;
    acc[indexB] = indexA;
  }

  return acc;
}, {});

const FIELDS = [
  "Nominal_Voltage",
  "Test_Voltage",
  "HV_P_Front",
  "HV_N_Front",
  "DC_P_Front",
  "DC_N_Front",
  "AC_L1_Front",
  "AC_L2_Front",
  "AC_L3_Front",
  "AC_N_Front",
  "HV_P_Rear",
  "HV_N_Rear",
  "DC_P_Rear",
  "DC_N_Rear",
  "AC_L1_Rear",
  "AC_L2_Rear",
  "AC_L3_Rear",
  "AC_N_Rear"
];

const GREATER_THAN_THRESHOLD_VALUE = ">5000000";

type CaptureMode =
  | "sample"
  | "preview"
  | "data-entry"
  | "guidance";

export function TakePhoto() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [captureMode, setCaptureMode] =
    useState<CaptureMode>("guidance");
  const [capturedPhotos, setCapturedPhotos] = useState<{
    [key: number]: string;
  }>({});
  const [currentPhoto, setCurrentPhoto] = useState<
    string | null
  >(null);
  const [formData, setFormData] = useState<{
    [key: string]: string;
  }>({});
  const [dbReady, setDbReady] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const dbRef = useRef<IDBDatabase | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const totalSteps = PHOTO_STEPS.length + 2; // 40 photos + 1 data entry + 1 export
  const isPhotoStep = currentStep < PHOTO_STEPS.length;
  const currentPhotoStep = isPhotoStep
    ? PHOTO_STEPS[currentStep]
    : null;
  const isDataEntryStep = currentStep === PHOTO_STEPS.length;
  const isExportStep = currentStep === PHOTO_STEPS.length + 1;

  // Initialize IndexedDB
  useEffect(() => {
    const initDB = async () => {
      try {
        // Request persistent storage
        if (navigator.storage && navigator.storage.persist) {
          const isPersisted = await navigator.storage.persist();
          if (!isPersisted) {
            console.warn("Storage may not be persisted");
          }
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
          const errorMsg = "無法開啟本地儲存資料庫，照片將無法保存";
          setDbError(errorMsg);
          alert(`⚠️ ${errorMsg}\n\n請確保瀏覽器允許使用本地儲存功能。`);
        };

        request.onsuccess = (event) => {
          dbRef.current = (event.target as IDBOpenDBRequest).result;
          setDbReady(true);
          loadFromIndexedDB();
        };

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
      } catch (error) {
        const errorMsg = "IndexedDB 初始化失敗";
        setDbError(errorMsg);
        console.error(errorMsg, error);
      }
    };

    initDB();

    return () => {
      if (dbRef.current) {
        dbRef.current.close();
      }
    };
  }, []);

  // Preload guide images on initial load to reduce step switching latency.
  useEffect(() => {
    const preloadedImages = GUIDE_IMAGE_URLS.map((url) => {
      const img = new window.Image();
      img.src = url;
      return img;
    });

    return () => {
      preloadedImages.forEach((img) => {
        img.src = "";
      });
    };
  }, []);

  // Load data from IndexedDB
  const loadFromIndexedDB = () => {
    if (!dbRef.current) return;

    const transaction = dbRef.current.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);

    // Load photos
    const photosRequest = store.get("capturedPhotos");
    photosRequest.onsuccess = () => {
      if (photosRequest.result) {
        setCapturedPhotos(photosRequest.result);
      }
    };

    // Load form data
    const formRequest = store.get("formData");
    formRequest.onsuccess = () => {
      if (formRequest.result) {
        setFormData(formRequest.result);
      }
    };

    // Load current step
    const stepRequest = store.get("currentStep");
    stepRequest.onsuccess = () => {
      if (stepRequest.result !== undefined) {
        setCurrentStep(stepRequest.result);
      }
    };
  };

  // Save to IndexedDB
  const saveToIndexedDB = (key: string, value: any) => {
    if (!dbRef.current) return;

    const transaction = dbRef.current.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.put(value, key);

    transaction.onerror = () => {
      console.error("Failed to save to IndexedDB");
    };
  };

  // Save photos to IndexedDB whenever they change
  useEffect(() => {
    if (dbReady) {
      saveToIndexedDB("capturedPhotos", capturedPhotos);
    }
  }, [capturedPhotos, dbReady]);

  // Save form data to IndexedDB whenever it changes
  useEffect(() => {
    if (dbReady) {
      saveToIndexedDB("formData", formData);
    }
  }, [formData, dbReady]);

  // Save current step to IndexedDB whenever it changes
  useEffect(() => {
    if (dbReady) {
      saveToIndexedDB("currentStep", currentStep);
    }
  }, [currentStep, dbReady]);

  // Clear all data from IndexedDB
  const clearAllData = () => {
    if (!dbRef.current) return;

    const confirmClear = window.confirm(
      "確定要清除所有已保存的照片和數據嗎？此操作無法復原。"
    );

    if (!confirmClear) return;

    const transaction = dbRef.current.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.clear();

    transaction.oncomplete = () => {
      setCapturedPhotos({});
      setFormData({});
      setCurrentStep(0);
      setCaptureMode("guidance");
      alert("✓ 所有數據已清除");
    };
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  const openGallery = () => {
    galleryInputRef.current?.click();
  };

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const photoData = e.target?.result as string;
        setCurrentPhoto(photoData);
        setCaptureMode("sample");
      };
      reader.readAsDataURL(file);
    }
    event.target.value = "";
  };

  const saveCurrentPhotoToStep = () => {
    if (!currentPhoto || !isPhotoStep) return;

    setCapturedPhotos((prev) => {
      const updatedPhotos = {
        ...prev,
        [currentStep]: currentPhoto,
      };

      const pairedStep = SHARED_PHOTO_INDEX_MAP[currentStep];
      const shouldCopyToPair =
        pairedStep !== undefined &&
        !prev[currentStep] &&
        !prev[pairedStep];

      if (shouldCopyToPair) {
        updatedPhotos[pairedStep] = currentPhoto;
      }

      return updatedPhotos;
    });
  };

  const savePhoto = () => {
    if (currentPhoto) {
      saveCurrentPhotoToStep();
      setCurrentPhoto(null);
      // Auto advance to next step
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
        setCaptureMode("guidance");
      } else {
        setCaptureMode("guidance");
      }
    }
  };

  const retakePhoto = () => {
    setCurrentPhoto(null);
    setCaptureMode("guidance");
  };

  const skipStep = () => {
    setCurrentPhoto(null);
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
      setCaptureMode("guidance");
    }
  };

  const goToPrevious = () => {
    setCurrentPhoto(null);
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setCaptureMode("guidance");
    }
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    setCurrentPhoto(null);
    setCaptureMode(
      step === PHOTO_STEPS.length ? "data-entry" : "guidance",
    );
    setDrawerOpen(false);
  };

  const handleSliderChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newStep = parseInt(e.target.value);
    setCurrentStep(newStep);
    setCurrentPhoto(null);
    setCaptureMode(
      newStep === PHOTO_STEPS.length
        ? "data-entry"
        : "guidance",
    );
  };

  const handleDataChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSetGreaterThanThreshold = (field: string) => {
    handleDataChange(field, GREATER_THAN_THRESHOLD_VALUE);
  };

  const exportAll = async () => {
    const chassisNumber = formData["Chassis_Number"] || "UNKNOWN";
    
    if (!chassisNumber || chassisNumber === "UNKNOWN") {
      alert("請先填寫車架號碼");
      return;
    }

    const zip = new JSZip();

    // Create empty folders
    zip.folder("Application");
    zip.folder("COC");
    zip.folder("Declare");
    zip.folder("Fact_Sheet");

    // Add photos to their respective folders
    Object.entries(capturedPhotos).forEach(
      ([stepIndex, photoData]) => {
        const step = PHOTO_STEPS[Number(stepIndex)];
        if (step) {
          const base64Data = photoData.split(",")[1];
          const folder = zip.folder(step.folder);
          folder?.file(`${step.id}.jpeg`, base64Data, {
            base64: true,
          });
        }
      },
    );

    // Create Data.xlsx
    const data = FIELDS.map((field) => ({
      Field: field,
      Value: formData[field] || "",
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "Data Record",
    );
    worksheet["!cols"] = [{ wch: 25 }, { wch: 15 }];

    const excelBuffer = XLSX.write(workbook, {
      bookType: "xlsx",
      type: "array",
    });
    zip.file("Data.xlsx", excelBuffer);

    // Generate and download
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const fileName = `${chassisNumber}.zip`;
    a.download = fileName;
    a.click();

    window.setTimeout(() => {
      URL.revokeObjectURL(url);
      navigate("/");
    }, 100);
  };

  const photoCompletedCount =
    Object.keys(capturedPhotos).length;
  
  // Check if ready to export based on REQUIRE_ALL_STEPS setting
  const canExport = REQUIRE_ALL_STEPS 
    ? (photoCompletedCount === PHOTO_STEPS.length && formData["Chassis_Number"])
    : (photoCompletedCount > 0 && formData["Chassis_Number"]);

  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate("/")}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex-1 mx-4"
          >
            <div className="text-center">
              <h1 className="font-semibold">
                步驟 {currentStep + 1} / {totalSteps}
              </h1>
              <p className="text-sm text-gray-500">
                {isDataEntryStep
                  ? "數據記錄"
                  : isExportStep
                    ? "匯出"
                    : currentPhotoStep?.name ?? "步驟"}
              </p>
            </div>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Settings className="w-6 h-6" />
          </button>
        </div>
        {/* Progress Bar */}
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              {/* Background track */}
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{
                    width: `${((currentStep + 1) / totalSteps) * 100}%`,
                  }}
                />
              </div>
              {/* Interactive slider */}
              <input
                type="range"
                min="0"
                max={totalSteps - 1}
                value={currentStep}
                onChange={handleSliderChange}
                className="absolute inset-0 w-full h-2 opacity-0 cursor-pointer"
                style={{ zIndex: 10 }}
              />
              {/* Step markers */}
              <div className="absolute inset-0 flex items-center justify-between px-1 pointer-events-none">
                {Array.from({ length: totalSteps }).map(
                  (_, i) => (
                    <div
                      key={i}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i <= currentStep
                          ? "bg-blue-600 scale-125"
                          : "bg-gray-300"
                      }`}
                    />
                  ),
                )}
              </div>
            </div>
            <span className="text-sm font-medium text-gray-600 min-w-[50px] text-right">
              {currentStep + 1}/{totalSteps}
            </span>
          </div>
          <p className="text-xs text-gray-500 text-center mt-2">
            滑動進度條切換步驟
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Hidden file inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {isPhotoStep && captureMode === "guidance" && currentPhotoStep && (
          <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6 shadow-sm border-2 border-blue-200">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-blue-500 rounded-full p-2 mt-1">
                  <Info className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <h2 className="font-semibold text-blue-900 mb-2">
                    拍攝指引
                  </h2>
                  <p className="text-sm text-blue-800 leading-relaxed">
                    {currentPhotoStep.guidance}
                  </p>
                </div>
              </div>

              {/* Guidance Image */}
              <div className="mt-4 mb-4">
                <p className="text-xs text-blue-700 mb-2 font-medium">
                  參考範例：
                </p>
                <div className="aspect-video bg-white rounded-lg overflow-hidden border-2 border-blue-300 relative">
                  <img
                    src={resolveGuideImageUrl(currentPhotoStep.guideImage)}
                    alt="拍攝範例"
                    className="w-full h-full object-contain bg-white"
                    onError={(e) => {
                      // Fallback if image doesn't exist
                      e.currentTarget.style.display = "none";
                      const parent =
                        e.currentTarget.parentElement;
                      if (parent) {
                        parent.innerHTML = `
                          <div class="w-full h-full flex items-center justify-center bg-gray-100">
                            <div class="text-center">
                              <svg class="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                              </svg>
                              <p class="text-gray-500 text-sm">請上傳 guide${currentPhotoStep.id}.jpg</p>
                            </div>
                          </div>
                        `;
                      }
                    }}
                  />
                </div>
              </div>

              {/* Preview if already captured */}
              {capturedPhotos[currentStep] && (
                <div className="mt-4">
                  <p className="text-xs text-green-700 mb-2 font-medium">
                    ✓ 已拍攝照片：
                  </p>
                  <div className="aspect-video bg-white rounded-lg overflow-hidden border-2 border-green-300">
                    <img
                      src={capturedPhotos[currentStep]}
                      alt="已拍攝"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setCaptureMode("sample")}
              className="w-full bg-blue-500 text-white rounded-lg py-4 font-medium hover:bg-blue-600 transition-colors active:scale-[0.98] shadow-lg"
            >
              <div className="flex items-center justify-center gap-2">
                <Camera className="w-5 h-5" />
                {capturedPhotos[currentStep]
                  ? "重新拍攝"
                  : "開始拍攝"}
              </div>
            </button>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                <div className="text-2xl font-bold text-blue-600">
                  {photoCompletedCount}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  已完成
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                <div className="text-2xl font-bold text-orange-600">
                  {PHOTO_STEPS.length - photoCompletedCount}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  待拍攝
                </div>
              </div>
              <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                <div className="text-2xl font-bold text-gray-600">
                  {PHOTO_STEPS.length}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  總數
                </div>
              </div>
            </div>
          </div>
        )}

        {isPhotoStep && captureMode === "sample" && currentPhotoStep && (
          <div className="flex-1 flex flex-col p-4 space-y-4">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="font-semibold mb-2">
                {currentPhotoStep.name}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                請拍攝或選擇照片
              </p>

              {/* Photo Preview if already captured */}
              {currentPhoto || capturedPhotos[currentStep] ? (
                <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-4 overflow-hidden relative">
                  <img
                    src={currentPhoto || capturedPhotos[currentStep]}
                    alt="已拍攝"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-2">
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              ) : (
                <div className="aspect-[4/3] bg-gray-200 rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <Camera className="w-16 h-16 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500 text-sm">尚未拍攝</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={openCamera}
                  className="bg-blue-500 text-white rounded-lg py-3 font-medium hover:bg-blue-600 transition-colors active:scale-[0.98]"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Camera className="w-5 h-5" />
                    拍照
                  </div>
                </button>

                <button
                  onClick={openGallery}
                  className="bg-purple-500 text-white rounded-lg py-3 font-medium hover:bg-purple-600 transition-colors active:scale-[0.98]"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Image className="w-5 h-5" />
                    相簿
                  </div>
                </button>
              </div>
            </div>

            {/* Completed Photos Summary */}
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <h3 className="font-medium mb-2">已完成照片</h3>
              <div className="text-sm text-gray-600">
                {photoCompletedCount} / {PHOTO_STEPS.length} 張
              </div>
            </div>
          </div>
        )}

        {isDataEntryStep && (
          <div className="flex-1 p-4 pb-24 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
              <div className="p-4 bg-blue-50 border-b border-blue-200">
                <h2 className="font-semibold text-blue-900">
                  數據記錄
                </h2>
                <p className="text-sm text-blue-700 mt-1">
                  請填寫車架號碼及測量數值
                </p>
              </div>
              <div className="divide-y divide-gray-200">
                {FIELDS.map((field) => (
                  <div
                    key={field}
                    className="flex items-center p-3"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <label className={`block text-sm font-medium truncate ${
                        field === "Chassis_Number" ? "text-red-700" : "text-gray-700"
                      }`}>
                        {field === "Chassis_Number" && "* "}
                        {field.replace(/_/g, " ")}
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSetGreaterThanThreshold(field)}
                        className="px-2 py-2 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                      >
                        {GREATER_THAN_THRESHOLD_VALUE}
                      </button>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData[field] || ""}
                        onChange={(e) =>
                          handleDataChange(field, e.target.value)
                        }
                        placeholder="0.00"
                        className="w-28 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-right border-gray-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {isExportStep && (
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-4">
              <div className="p-4 bg-green-50 border-b border-green-200">
                <h2 className="font-semibold text-green-900">準備匯出</h2>
                <p className="text-sm text-green-700 mt-1">
                  請確認資料後，點擊下方「匯出所有資料」。
                </p>
              </div>
              <div className="p-4 space-y-4 text-sm">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    * Chassis Number
                  </label>
                  <input
                    type="text"
                    value={formData["Chassis_Number"] || ""}
                    onChange={(e) =>
                      handleDataChange("Chassis_Number", e.target.value)
                    }
                    placeholder="請輸入車架號碼"
                    className="w-full px-3 py-2 border border-red-300 bg-red-50 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">已完成照片</span>
                  <span className="font-medium">{photoCompletedCount}/{PHOTO_STEPS.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">車架號碼</span>
                  <span className="font-medium">{formData["Chassis_Number"] || "未填寫"}</span>
                </div>

                <div>
                  <h3 className="font-medium text-gray-800 mb-2">照片預覽</h3>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(capturedPhotos)
                      .slice(0, 8)
                      .map(([stepIndex, photo]) => (
                        <div key={stepIndex} className="aspect-square rounded overflow-hidden border border-gray-200 bg-gray-50">
                          <img src={photo} alt={`step-${stepIndex}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                  </div>
                  {photoCompletedCount > 8 && (
                    <p className="text-xs text-gray-500 mt-2">
                      還有 {photoCompletedCount - 8} 張照片未顯示
                    </p>
                  )}
                </div>

                <div>
                  <h3 className="font-medium text-gray-800 mb-2">數據預覽</h3>
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {FIELDS.filter((field) => formData[field]).length > 0 ? (
                      FIELDS.filter((field) => formData[field]).map((field) => (
                        <div key={field} className="px-3 py-2 flex items-center justify-between text-xs">
                          <span className="text-gray-600">{field}</span>
                          <span className="font-medium text-gray-900">{formData[field]}</span>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-3 text-xs text-gray-500">尚未填寫數據</div>
                    )}
                  </div>
                </div>

                {!formData["Chassis_Number"] && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-800">請先輸入車架號碼才能匯出</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={goToPrevious}
                    className="bg-gray-200 text-gray-900 rounded-lg py-2.5 font-medium hover:bg-gray-300 transition-colors active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <ChevronLeft className="w-4 h-4" />
                      返回上一頁
                    </div>
                  </button>

                  <button
                    onClick={exportAll}
                    disabled={!canExport}
                    className="bg-green-500 text-white rounded-lg py-2.5 font-medium hover:bg-green-600 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Download className="w-4 h-4" />
                      匯出資料夾
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Footer */}
      {!isExportStep && (
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 space-y-3">
        {canExport && (
          <button
            onClick={exportAll}
            className="w-full bg-green-500 text-white rounded-lg py-3 font-medium hover:bg-green-600 transition-colors active:scale-[0.98] shadow-lg mb-2"
          >
            <div className="flex items-center justify-center gap-2">
              <Download className="w-5 h-5" />
              匯出所有資料
            </div>
          </button>
        )}

        {!canExport && isDataEntryStep && !formData["Chassis_Number"] && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">請先填寫車架號碼才能匯出</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={goToPrevious}
            disabled={currentStep === 0}
            className="bg-gray-200 text-gray-900 rounded-lg py-2.5 font-medium hover:bg-gray-300 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-1">
              <ChevronLeft className="w-4 h-4" />
              上一步
            </div>
          </button>

          <button
            onClick={skipStep}
            disabled={currentStep === totalSteps - 1}
            className="bg-orange-500 text-white rounded-lg py-2.5 font-medium hover:bg-orange-600 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-1">
              <SkipForward className="w-4 h-4" />
              跳過
            </div>
          </button>

          <button
            onClick={() => {
              if (isPhotoStep && currentPhoto) {
                saveCurrentPhotoToStep();
              }
              if (currentStep < totalSteps - 1) {
                setCurrentStep(currentStep + 1);
                setCurrentPhoto(null);
                setCaptureMode("guidance");
              }
            }}
            disabled={currentStep === totalSteps - 1}
            className="bg-blue-500 text-white rounded-lg py-2.5 font-medium hover:bg-blue-600 transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center justify-center gap-1">
              下一步
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      </div>
      )}

      {/* Step Selector Drawer */}
      <Drawer.Root
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[20px] h-[85vh] mt-24 fixed bottom-0 left-0 right-0 z-50">
            <div className="p-4 bg-white rounded-t-[20px] flex-shrink-0 border-b border-gray-200">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-4" />
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">
                  選擇步驟
                </h2>
                <div className="text-sm text-gray-500">
                  {photoCompletedCount}/{PHOTO_STEPS.length}{" "}
                  已完成
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {PHOTO_STEPS.map((step, index) => (
                  <button
                    key={step.id}
                    onClick={() => goToStep(index)}
                    className={`w-full text-left p-4 rounded-lg transition-all ${
                      index === currentStep
                        ? "bg-blue-500 text-white shadow-lg"
                        : capturedPhotos[index]
                          ? "bg-green-50 border-2 border-green-300 hover:bg-green-100"
                          : "bg-gray-50 border-2 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                          index === currentStep
                            ? "bg-white/20 text-white"
                            : capturedPhotos[index]
                              ? "bg-green-500 text-white"
                              : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        {capturedPhotos[index] ? (
                          <Check className="w-5 h-5" />
                        ) : (
                          step.id
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div
                          className={`font-medium truncate ${
                            index === currentStep
                              ? "text-white"
                              : "text-gray-900"
                          }`}
                        >
                          {step.name}
                        </div>
                        <div
                          className={`text-xs mt-1 truncate ${
                            index === currentStep
                              ? "text-white/80"
                              : "text-gray-500"
                          }`}
                        >
                          {step.folder}
                        </div>
                      </div>
                      {capturedPhotos[index] && (
                        <div className="flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 border-white">
                          <img
                            src={capturedPhotos[index]}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </button>
                ))}

                {/* Data Entry Step */}
                <button
                  onClick={() => goToStep(PHOTO_STEPS.length)}
                  className={`w-full text-left p-4 rounded-lg transition-all ${
                    isDataEntryStep
                      ? "bg-blue-500 text-white shadow-lg"
                      : Object.keys(formData).length > 0
                        ? "bg-green-50 border-2 border-green-300 hover:bg-green-100"
                        : "bg-gray-50 border-2 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                        isDataEntryStep
                          ? "bg-white/20 text-white"
                          : Object.keys(formData).length > 0
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-600"
                      }`}
                    >
                      {Object.keys(formData).length > 0 ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        "📊"
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        className={`font-medium truncate ${
                          isDataEntryStep
                            ? "text-white"
                            : "text-gray-900"
                        }`}
                      >
                        數據記錄
                      </div>
                      <div
                        className={`text-xs mt-1 truncate ${
                          isDataEntryStep
                            ? "text-white/80"
                            : "text-gray-500"
                        }`}
                      >
                        填寫電壓測量數據
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>

      {/* Settings Drawer */}
      <Drawer.Root
        open={showSettings}
        onOpenChange={setShowSettings}
      >
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/40 z-40" />
          <Drawer.Content className="bg-white flex flex-col rounded-t-[20px] h-[60vh] mt-24 fixed bottom-0 left-0 right-0 z-50">
            <div className="p-4 bg-white rounded-t-[20px] flex-shrink-0 border-b border-gray-200">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-gray-300 mb-4" />
              <h2 className="text-lg font-semibold">設置</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Database Status */}
              <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-500" />
                  資料儲存狀態
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">本地資料庫：</span>
                    <span className={dbReady ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                      {dbReady ? "✓ 已連接" : "✗ 未連接"}
                    </span>
                  </div>
                  {dbError && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 text-red-700">
                      {dbError}
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">已保存照片：</span>
                    <span className="font-medium">{photoCompletedCount} 張</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">已填寫欄位：</span>
                    <span className="font-medium">{Object.keys(formData).length} 項</span>
                  </div>
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded text-xs text-blue-800">
                  <p className="font-medium mb-1">💡 自動保存功能</p>
                  <p>照片和數據會自動保存到瀏覽器本地儲存。即使關閉分頁，下次開啟時仍可恢復。</p>
                </div>
              </div>

              {/* Export Settings */}
              <div className="bg-white rounded-lg border-2 border-gray-200 p-4">
                <h3 className="font-semibold mb-2">匯出設置</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">必須完成所有步驟：</span>
                    <span className={`font-medium ${REQUIRE_ALL_STEPS ? "text-orange-600" : "text-green-600"}`}>
                      {REQUIRE_ALL_STEPS ? "是" : "否"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {REQUIRE_ALL_STEPS 
                      ? "必須完成所有40張照片和數據記錄才能匯出" 
                      : "只要有照片和車架號碼即可匯出，未完成的步驟將被跳過"}
                  </p>
                </div>
              </div>

              {/* Clear Data */}
              <div className="bg-white rounded-lg border-2 border-red-200 p-4">
                <h3 className="font-semibold mb-2 text-red-700">清除資料</h3>
                <p className="text-sm text-gray-600 mb-3">
                  清除所有已保存的照片和數據記錄。此操作無法復原。
                </p>
                <button
                  onClick={clearAllData}
                  className="w-full bg-red-500 text-white rounded-lg py-2.5 font-medium hover:bg-red-600 transition-colors active:scale-[0.98]"
                >
                  清除所有資料
                </button>
              </div>

              {/* Storage Info */}
              <div className="bg-gray-50 rounded-lg p-4 text-xs text-gray-600">
                <p className="font-medium mb-2">⚠️ 瀏覽器儲存說明</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>請確保瀏覽器允許使用本地儲存</li>
                  <li>無痕模式下資料可能無法保存</li>
                  <li>清除瀏覽器資料會刪除所有照片</li>
                  <li>建議定期匯出備份</li>
                </ul>
              </div>
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}