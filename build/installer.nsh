!ifndef BUILD_UNINSTALLER
!include "nsDialogs.nsh"
Var ModelChoice
Var ModelRecommended
Var ModelSmall
Var ModelLater
!macro customPageAfterChangeDir
 Page custom CapricornModels CapricornModelsLeave
 !define MUI_PAGE_CUSTOMFUNCTION_SHOW CapricornInstalling
!macroend
Function CapricornInstalling
 ; Prevent closing the copy stage into a half-installed application.
 GetDlgItem $0 $HWNDPARENT 2
 EnableWindow $0 0
 System::Call 'user32::GetSystemMenu(p $HWNDPARENT, i 0) p .r1'
 System::Call 'user32::EnableMenuItem(p r1, i 0xF060, i 1)'
 CreateDirectory "$INSTDIR"
 FileOpen $0 "$INSTDIR\.capricorn-installing" w
 FileWrite $0 "Installation is not complete. Run the installer again."
 FileClose $0
FunctionEnd
Function CapricornModels
 nsDialogs::Create 1018
 Pop $0
 ${NSD_CreateLabel} 0 0 100% 40u "Capricorn includes local speech and its own AI engine. Choose a chat model to download automatically after installation. Internet is needed once; downloads can be retried."
 Pop $0
 ${NSD_CreateRadioButton} 0 52u 100% 22u "Recommended: Qwen3 1.7B (about 1.4 GB download)"
 Pop $ModelRecommended
 ${NSD_Check} $ModelRecommended
 ${NSD_CreateRadioButton} 0 82u 100% 22u "Smaller: Qwen3 0.6B (about 0.6 GB download)"
 Pop $ModelSmall
 ${NSD_CreateRadioButton} 0 112u 100% 22u "Download later (chat AI will need setup)"
 Pop $ModelLater
 nsDialogs::Show
FunctionEnd
Function CapricornModelsLeave
 StrCpy $ModelChoice "qwen3:1.7b"
 ${NSD_GetState} $ModelSmall $0
 ${If} $0 == ${BST_CHECKED}
  StrCpy $ModelChoice "qwen3:0.6b"
 ${EndIf}
 ${NSD_GetState} $ModelLater $0
 ${If} $0 == ${BST_CHECKED}
  StrCpy $ModelChoice "later"
 ${EndIf}
FunctionEnd
!macro customInstall
 ${If} $ModelChoice == ""
  StrCpy $ModelChoice "later"
 ${EndIf}
 FileOpen $0 "$INSTDIR\resources\setup-choice.json" w
 FileWrite $0 '{$\"model$\":$\"$ModelChoice$\"}'
 FileClose $0
 Delete "$INSTDIR\.capricorn-installing"
!macroend

!endif
