import '/_content/ZXingBlazor/lib/zxing/zxing.min.js';
var codeReader = null;
var id = null;
var supportsVibrate = false;
export function init(wrapper, element, elementid, options)
{
  console.log('init' + elementid + ' - Megalith Fork #1 - 0.2.904');
  id = elementid;
  let selectedDeviceId;
  const sourceSelect = element.querySelector("[data-action=sourceSelect]");
  const sourceSelectPanel = element.querySelector("[data-action=sourceSelectPanel]");
  let startButton = element.querySelector("[data-action=startButton]");
  let resetButton = element.querySelector("[data-action=resetButton]");
  let closeButton = element.querySelector("[data-action=closeButton]");
  supportsVibrate = "vibrate" in navigator;

  console.log('init' + startButton.innerHTML);

  if (options.pdf417)
  {
    codeReader = new ZXing.BrowserPDF417Reader();
    console.log('ZXing code PDF417 reader initialized')
  } else if (options.decodeAllFormats)
  {
    const hints = new Map();
    const formats = options.formats;
    hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, formats);
    codeReader = new ZXing.BrowserMultiFormatReader(hints)
    console.log('ZXing code reader initialized with all formats')
  } else
  {
    codeReader = new ZXing.BrowserMultiFormatReader()
    console.log('ZXing code reader initialized')
  }
  codeReader.timeBetweenDecodingAttempts = options.timeBetweenDecodingAttempts;

  codeReader.listVideoInputDevices()
    .then((videoInputDevices) =>
    {
      selectedDeviceId = videoInputDevices[0].deviceId
      console.log('videoInputDevices:' + videoInputDevices.length);      
      
      if (videoInputDevices.length > 1)
      {
        videoInputDevices.forEach((element) =>
        {
          const sourceOption = document.createElement('option');
          sourceOption.text = element.label
          sourceOption.value = element.deviceId
          sourceSelect.appendChild(sourceOption)
          selectedDeviceId = element.deviceId;
        })

        sourceSelect.onchange = () =>
        {
          // EBS @ 13.03.2023: Added - Fork 1 - 0.2.904
          // Store selected camera to local storage
          console.log("Storing selected camera to localstorage: " + sourceSelect.value);
          localStorage.setItem("currCamera", sourceSelect.value);

          selectedDeviceId = sourceSelect.value;
          codeReader.reset();
          StartScan();
        }

        sourceSelectPanel.style.display = 'block'
      }

      // EBS @ 13.03.2023: Added - Fork 1 - 0.2.904
      // Attempt to pre-select the correct camera on iOS and Android
      if (isiOS())
      {
        console.log("iOS detected, attempting to select the correct camera ...");

        //Iphone has the second [1] as back camera, Android also wich is the most common to scan with
        if (videoInputDevices.length > 1) { selectedDeviceId = videoInputDevices[1].deviceId }
      }

      StartScan();

      startButton.addEventListener('click', () =>
      {
        StartScan();
      })

      // EBS @ 13.03.2023: Added - Fork 1 - 0.2.904
      // Detect if iOS
      function isiOS()
      {
        if (typeof window === `undefined` || typeof navigator === `undefined`) return false;

        return /iPhone|iPad|iPod/i.test(navigator.userAgent || navigator.vendor || (window.opera && opera.toString() === `[object Opera]`));
      };

      function isAndroid()
      {
        if (typeof window === `undefined` || typeof navigator === `undefined`) return false;

        return /(android)/i.test(navigator.userAgent);
      };

      function StartScan()
      {
        // EBS @ 13.03.2023: Added - Fork 1 - 0.2.904
        // Change to pre selected camera if that exists
        var strLocalStorageCameraSelected = localStorage.getItem("currCamera");
        if (strLocalStorageCameraSelected != undefined && strLocalStorageCameraSelected != null && strLocalStorageCameraSelected != "")
        {
          console.log("Camera pre-selected found: " + strLocalStorageCameraSelected + " | Selecting ...");
          if (selectedDeviceId != strLocalStorageCameraSelected) selectedDeviceId = strLocalStorageCameraSelected;
        }          

        if (options.decodeonce)
        {
          codeReader.decodeOnceFromVideoDevice(selectedDeviceId, 'video').then((result) =>
          {
            console.log(result)
            if (supportsVibrate) navigator.vibrate(1000);
            console.log('autostop');
            codeReader.reset();
            return wrapper.invokeMethodAsync("GetResult", result.text);
          }).catch((err) =>
          {
            if (err && !(err instanceof ZXing.NotFoundException))
            {
              console.log(err)
              wrapper.invokeMethodAsync("GetError", err + '');
            }
          })
        } else
        {
          codeReader.decodeFromVideoDevice(selectedDeviceId, 'video', (result, err) =>
          {
            if (result)
            {
              console.log(result)
              if (supportsVibrate) navigator.vibrate(1000);
              console.log('None-stop');
              wrapper.invokeMethodAsync("GetResult", result.text);
            }
            if (err && !(err instanceof ZXing.NotFoundException))
            {
              console.log(err)
              wrapper.invokeMethodAsync("GetError", err + '');
            }
          })
        }

        var x = `decodeContinuously`;
        if (options.decodeonce) x = `decodeOnce`;
        console.log(`Started ` + x + ` decode from camera with id ${selectedDeviceId}`)
      }

      resetButton.addEventListener('click', () =>
      {
        codeReader.reset();
        console.log('Reset.')
      })

      closeButton.addEventListener('click', () =>
      {
        codeReader.reset();
        console.log('closeButton.')
        wrapper.invokeMethodAsync("CloseScan");
      })

    })
    .catch((err) =>
    {
      console.log(err)
      wrapper.invokeMethodAsync("GetError", err + '');
    })

}
export function destroy(elementid)
{
  if (undefined !== codeReader && null !== codeReader && id == elementid)
  {
    codeReader.reset();
    codeReader = null;
    //id = null;
    console.log(id, 'destroy');
  }
}