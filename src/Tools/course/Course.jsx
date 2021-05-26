/**
 * External dependencies
 */
import React, { useEffect, useState, Suspense, useContext } from 'react';

import { useHistory } from 'react-router-dom';
import {
  atom,
  useSetRecoilState,
  useRecoilValue,
  selector,
  useRecoilState,
  selectorFamily,
  useRecoilValueLoadable,
  useRecoilStateLoadable,
  useRecoilCallback,
  atomFamily,
} from 'recoil';
import axios from 'axios';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import { nanoid } from 'nanoid';

/**
 * Internal dependencies
 */
import Drive, {
  folderDictionarySelector,
  clearDriveAndItemSelections,
  encodeParams,
  drivePathSyncFamily,
} from '../../_reactComponents/Drive/Drive';
import { BreadcrumbContainer } from '../../_reactComponents/Breadcrumb';
import Button from '../../_reactComponents/PanelHeaderComponents/Button';
import DriveCards from '../../_reactComponents/Drive/DriveCards';
import '../../_reactComponents/Drive/drivecard.css';
import '../../_utils/util.css';
import GlobalFont from '../../_utils/GlobalFont';
import Tool from '../_framework/Tool';
import { useToolControlHelper, ProfileContext } from '../_framework/ToolRoot';
import Toast, { useToast } from '../_framework/Toast';
import { drivecardSelectedNodesAtom,URLPathSync } from '../library/Library';
import Enrollment from './Enrollment';
import { useAssignment } from '../course/CourseActions';
import { useAssignmentCallbacks } from '../../_reactComponents/Drive/DriveActions';
import { selectedInformation } from '../library/Library';
// import {assignmentDictionary} from "../_framework/Overlays/Content"
import CollapseSection from '../../_reactComponents/PanelHeaderComponents/CollapseSection';
import { 
  itemHistoryAtom, 
  fileByContentId 
} from '../../_sharedRecoil/content';

const versionHistoryReleasedSelectedAtom = atom({
  key:"versionHistoryReleasedSelectedAtom",
  default:""
})
const viewerDoenetMLAtom = atom({
  key: "viewerDoenetMLAtom",
  default: {updateNumber: 0, doenetML: ""}
});
export const roleAtom = atom({
  key: 'roleAtom',
  default: 'Instructor',
});
export const selectedVersionAtom = atom({
  key: 'selectedVersionAtom',
  default: '',
});
const loadAssignmentSelector = selectorFamily({
  key: 'loadAssignmentSelector',
  get: (branchIdcontentId) => async ({ get, set }) => {
    const { data } = await axios.get(
      `/api/getAllAssignmentSettings.php?branchId=${branchIdcontentId.branchId}&contentId=${branchIdcontentId.contentId}`,
    );
    return data;
  },
  
});
export const assignmentDictionary = atomFamily({            
  key: 'assignmentDictionary',
  default: selectorFamily({
    key: 'assignmentDictionary/Default',
    get: (driveIditemIdbranchIdparentFolderId) => async (
      { get },
      instructions,
    ) => {
      let folderInfoQueryKey = {
        driveId: driveIditemIdbranchIdparentFolderId.driveId,
        folderId: driveIditemIdbranchIdparentFolderId.folderId,
      };
      let folderInfo = get(folderDictionarySelector(folderInfoQueryKey));
      const itemObj =
        folderInfo?.contentsDictionary?.[
          driveIditemIdbranchIdparentFolderId.itemId
        ];
      if (driveIditemIdbranchIdparentFolderId.branchId) {
        const aInfo = await get(loadAssignmentSelector({branchId:driveIditemIdbranchIdparentFolderId.branchId,contentId:driveIditemIdbranchIdparentFolderId.contentId}));
        if (aInfo) {
          return aInfo?.assignments[0];
        } else return null;
      } else return null;
    },
  }),
});
let assignmentDictionarySelector = selectorFamily({
  key: 'assignmentDictionaryNewSelector',
  get: (driveIditemIdbranchIdparentFolderId) => ({ get }) => {
    return get(assignmentDictionary(driveIditemIdbranchIdparentFolderId));
  },
});

function Container(props) {
  return (
    <div
      style={{
        maxWidth: '850px',
        // border: "1px red solid",
        padding: '20px',
        display: 'grid',
      }}
    >
      {props.children}
    </div>
  );
}



function AutoSelect(props) {
  const { openOverlay,activateMenuPanel } = useToolControlHelper();

  const contentInfoLoad = useRecoilValueLoadable(selectedInformation);
  
  if(contentInfoLoad.state === "hasValue"){
    const versionHistory = useRecoilValueLoadable(itemHistoryAtom(contentInfoLoad?.contents?.itemInfo?.branchId))

    if (versionHistory.state === "loading"){ return null;}
    if (versionHistory.state === "hasError"){ 
      console.error(versionHistory.contents)
      return null;}
      if (versionHistory.state === "hasValue"){ 
        const contentId = versionHistory.contents.named.contentId;
  
       }
  }

  
  if (contentInfoLoad?.contents?.number > 0) {
    activateMenuPanel(0);
  } else {
    activateMenuPanel(1);
  }
  return null;
}



export default function Course(props) {
  const { openOverlay, activateMenuPanel } = useToolControlHelper();
  const [toast, toastType] = useToast();
  let routePathDriveId = '';
  let routePathFolderId = '';
  let pathItemId = '';
  let itemType = '';
  let urlParamsObj = Object.fromEntries(
    new URLSearchParams(props.route.location.search),
  );
  const setDrivecardSelection = useSetRecoilState(drivecardSelectedNodesAtom);
  const clearSelections = useSetRecoilState(clearDriveAndItemSelections);
  const [openEnrollment, setEnrollmentView] = useState(false);
  const [viewAccess, setViewAccess] = useState(false);
  const role = useRecoilValue(roleAtom);
  const  setDrivePath = useSetRecoilState(drivePathSyncFamily("main"));

  if (urlParamsObj?.path !== undefined) {
    [
      routePathDriveId,
      routePathFolderId,
      pathItemId,
      itemType,
    ] = urlParamsObj.path.split(':');
  }
  if (urlParamsObj?.path !== undefined) {
    [routePathDriveId] = urlParamsObj.path.split(':');
  }

  //Select +Add menuPanel if no course selected on startup
  useEffect(() => {
    if (routePathDriveId === '') {
      activateMenuPanel(1);
    }
  }, []);
  const history = useHistory();

  function cleardrivecardSelection() {
    setDrivePath({
      driveId:"",
      parentFolderId:"",
      itemId:"",
      type:""
    })
    // setDrivecardSelection([]);
  }
  function useOutsideDriveSelector() {
    setDrivePath({
      driveId:"",
      parentFolderId:"",
      itemId:"",
      type:""
    })
  }
  let breadcrumbContainer = <BreadcrumbContainer drivePathSyncKey="main"/>;

  const setEnrollment = (e) => {
    e.preventDefault();
    setEnrollmentView(!openEnrollment);
  };
  const setViewAccessToggle = (e) => {
    e.preventDefault();
    setViewAccess(!viewAccess);
  };
  const enrollDriveId = { driveId: routePathDriveId };
  let hideUnpublished = true;
  if (role === 'Instructor') {
    hideUnpublished = false;
  }
  let urlClickBehavior = '';
  if (role === 'Instructor') {
    urlClickBehavior = 'select';
  }
  let responsiveControls = '';

  if (routePathDriveId) {
    responsiveControls = (
      <>
      <Button
        value={openEnrollment ? 'Close Enrollment' : 'Open Enrollment'}
        callback={(e) => setEnrollment(e)}
      ></Button>
      
        <Button
        value={viewAccess ? 'released' : 'assigned'}
        callback={(e) => setViewAccessToggle(e)}
      ></Button>
      </>
      
    );
     
    
  }


  const profile = useContext(ProfileContext);
  if (profile.signedIn === '0') {
    return (
      <>
        <GlobalFont />
        <Tool>
          <headerPanel title="Course"></headerPanel>

          <mainPanel>
            <div
              style={{
                border: '1px solid grey',
                borderRadius: '20px',
                margin: 'auto',
                marginTop: '10%',
                padding: '10px',
                width: '50%',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <h2>You are not signed in</h2>
                <h2>Course currently requires sign in for use</h2>
                <button style={{ background: '#1a5a99', borderRadius: '5px' }}>
                  <a
                    href="/signin"
                    style={{ color: 'white', textDecoration: 'none' }}
                  >
                    Sign in with this link
                  </a>
                </button>
              </div>
            </div>
          </mainPanel>
        </Tool>
      </>
    );
  }

  return (
    <>
   <URLPathSync route={props.route}/> 
   <GlobalFont />
    <Tool>
      <headerPanel title="Course" />
      <navPanel isInitOpen>
        <div
          style={{ marginBottom: '40px', height: '100vh' }}
          onClick={useOutsideDriveSelector}
        >
          <Drive driveId={routePathDriveId} foldersOnly={true} drivePathSyncKey="main"/>
        </div>
      </navPanel>

      <mainPanel responsiveControls={responsiveControls}>
        <AutoSelect />
        {openEnrollment ? (
          <Enrollment selectedCourse={enrollDriveId} />
        ) : (
          <>
            {breadcrumbContainer}
            <div
              onClick={() => {
                clearSelections();
              }}
              // className={routePathDriveId ? 'mainPanelStyle' : ''}
            >
              <Container>
                <Drive
                 columnTypes={['Due Date','Assigned']}
                 viewAccess={viewAccess ?   "assigned" : "released"} 
                  driveId={routePathDriveId}
                  hideUnpublished={hideUnpublished}
                  subTypes={['Administrator']}
                  urlClickBehavior="select"
                  drivePathSyncKey="main"
                  doenetMLDoubleClickCallback={(info)=>{
                    openOverlay({type:"content",branchId: info.item.branchId,title: info.item.label});
                  }}
                />
              </Container>
            </div>

            <div
              onClick={cleardrivecardSelection}
              tabIndex={0}
            >
              {!routePathDriveId && <h2>Admin</h2>}
              <DriveCards
                routePathDriveId={routePathDriveId}
                isOneDriveSelect={true}
                types={['course']}
                drivePathSyncKey="main"
                subTypes={['Administrator']}
              />
             
              {!routePathDriveId && <h2>Student</h2>}
              <DriveCards
              isOneDriveSelect={true}
                routePathDriveId={routePathDriveId}
                isOneDriveSelect={true}
                types={['course']}
                drivePathSyncKey="main"
                subTypes={['Student']}
              />
            </div>
          </>
        )}
      </mainPanel>
      {routePathDriveId && (
        <menuPanel isInitOpen title="Assigned">
                  <VersionInfo route={props.route}/>

          {/* <ItemInfoPanel route={props.route} /> */}
          <br />
          {/* <MaterialsInfo
           itemType={itemType} pathItemId={pathItemId} routePathDriveId={routePathDriveId} routePathFolderId={routePathFolderId} /> */}
        </menuPanel>
      )}
      <menuPanel title="Info">
          <ItemInfoPanel route={props.route} />
          </menuPanel>
    </Tool>
    </>
  );
}

const DoenetMLInfoPanel = (props) => {
  // console.log(">>>>>>>>>>> DoenetMLInfoPanel",props);
  let urlParamsObj = Object.fromEntries(
    new URLSearchParams(props.props.route.location.search),
  );
   
  const {addContentAssignment,changeSettings,saveSettings,assignmentToContent,loadAvailableAssignment, publishContentAssignment,onAssignmentError,} = useAssignment();
  const {makeAssignment,onmakeAssignmentError,publishAssignment,onPublishAssignmentError,publishContent,onPublishContentError, updateAssignmentTitle,onUpdateAssignmentTitleError,convertAssignmentToContent,onConvertAssignmentToContentError} = useAssignmentCallbacks();
  const selectedVId  = useRecoilValue(selectedVersionAtom); 
    // console.log(">>>>>>>>>>>>>>>>>>>>DoenetMLInfoPanel selectedVId",selectedVId);
  
  const itemInfo = props.contentInfo;
  const vInfo = props.versionArr;
  const versionHistory = useRecoilValueLoadable(itemHistoryAtom(itemInfo.branchId))

  const selectedContentId = () =>{
    const assignedArr =  versionHistory.contents.named.filter((item)=>item.versionId === selectedVId);
    if(assignedArr.length > 0) {
      return assignedArr[0].contentId;
    }else{
      return '';
    }
  }
  const assignmentInfoSettings = useRecoilValueLoadable(
    assignmentDictionarySelector({
      driveId: itemInfo.driveId,
      folderId: itemInfo.parentFolderId,
      itemId: itemInfo.itemId,
      branchId:itemInfo.branchId,
      versionId:selectedVId,
      contentId:selectedContentId()
    }),
    
  );

  let aInfo = '';
  let assignmentId = '';

  if (assignmentInfoSettings?.state === 'hasValue') {
    aInfo = assignmentInfoSettings?.contents;
    // console.log(">>>>>>>>>>aInfo",aInfo);
    if (aInfo?.assignmentId) {
      assignmentId = aInfo?.assignmentId;
    }
  }

  let publishContentButton = null;
  let makeAssignmentButton = null;
  let assignmentForm = null;
  let assignmentToContentButton = null;
  let loadAssignmentButton = null;
  let unPublishContentButton = null;
  let viewDoenetMLButton = (itemInfo.isAssigned === '0' &&
    <Button
      value="View Content"
      callback={() => {
        openOverlay({
          type: 'content',
          branchId: itemInfo?.branchId,
          // contentId: itemInfo?.contentId,
        });
      }}
    />
  );

  const { openOverlay,activateMenuPanel } = useToolControlHelper();
  const [addToast, ToastType] = useToast();
  const handleChange = (event) => {
    event.preventDefault();
    let name = event.target.name;
    let value =
      event.target.type === 'checkbox'
        ? event.target.checked
        : event.target.value;

    const result = changeSettings({
      [name]: value,
      driveIditemIdbranchIdparentFolderId: {
        driveId: itemInfo.driveId,
        folderId: itemInfo.parentFolderId,
        itemId: itemInfo.itemId,
        branchId:itemInfo.branchId,
        versionId:selectedVId,
        contentId:selectedContentId()
      },
    });
    result
      .then((resp) => {
        if (resp.data.success) {
          // addToast(`Renamed item to '${newLabel}'`, ToastType.SUCCESS);
        } else {
          // onRenameItemError({errorMessage: resp.data.message});
        }
      })
      .catch((e) => {
        // onRenameItemError({errorMessage: e.message});
      });
  };
  const handleOnBlur = (e) => {
    let name = e.target.name;
    let value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    const result = saveSettings({
      [name]: value,
      driveIditemIdbranchIdparentFolderId: {
        driveId: itemInfo.driveId,
        folderId: itemInfo.parentFolderId,
        itemId: itemInfo.itemId,
        branchId:itemInfo.branchId,
        versionId:selectedVId,
        contentId:selectedContentId()
      },
    });
    let payload = {
      ...aInfo,
      itemId: itemInfo.itemId,
      isAssigned: '1',
      assignmentId: aInfo?.assignmentId,
      [name]: value,
      branchId:itemInfo.branchId,
      contentId:itemInfo.contentId
    };
    // if (name === 'assignment_title') {
      updateAssignmentTitle({
        driveIdFolderId: {
          driveId: itemInfo.driveId,
          folderId: itemInfo.parentFolderId,
        },
        itemId: itemInfo.itemId,
        payloadAssignment: payload,
        branchId:itemInfo.branchId,
        contentId:itemInfo.contentId

      });

    // }

    result.then((resp) => {
      if (resp.data.success) {
        addToast(`Updated '${name}' to '${value}'`, ToastType.SUCCESS);
      } else {
        onAssignmentError({errorMessage: resp.data.message});
      }
    })
    .catch((e) => {
      onAssignmentError({errorMessage: e.message});
    });
  };
  const handlePublishContent = () => {
    let payload = {
      itemId: itemInfo.itemId,
    };
    publishContent({
      driveIdFolderId: {
        driveId: itemInfo.driveId,
        folderId: itemInfo.parentFolderId,
      },
      itemId: itemInfo.itemId,
      payload: payload,
    });

    const result = axios.post(`/api/handlePublishContent.php`, payload)
    result.then((resp) => {
      if (resp.data.success) {
      addToast(`'${itemInfo.label}' Published'`, ToastType.SUCCESS);
    } else {
        onAssignmentError({errorMessage: resp.data.message});
      }
    })
    .catch((e) => {
      onAssignmentError({errorMessage: e.message});
    });
  };

  const handleMakeContent = (e) => {
    let payload = {
      itemId: itemInfo.itemId,
    };
    
    assignmentToContent({
      driveIditemIdbranchIdparentFolderId: {
        driveId: itemInfo.driveId,
        folderId: itemInfo.parentFolderId,
        itemId: itemInfo.itemId,
      },
    });
   
    convertAssignmentToContent({
      driveIdFolderId: {
        driveId: itemInfo.driveId,
        folderId: itemInfo.parentFolderId,
      },
      itemId: itemInfo.itemId,
      assignedDataSavenew: payload,
    });

    const result = axios.post(`/api/handleMakeContent.php`, payload)
    result.then((resp) => {
      if (resp.data.success) {
        addToast(`'${itemInfo.assignment_title}' back to '${itemInfo.label}''`, ToastType.SUCCESS);
      } else {
        onAssignmentError({errorMessage: resp.data.message});
      }
    })
    .catch((e) => {
      onAssignmentError({errorMessage: e.message});
    });
  };

  const loadBackAssignment = () => {
    let payload = {
      itemId: itemInfo.itemId,
      branchId:itemInfo.branchId,
      isAssigned: '1',
      assignmentId: aInfo?.assignmentId,
      assignment_title: aInfo?.assignment_title,
    };
    loadAvailableAssignment({
      ...aInfo,
      driveIditemIdbranchIdparentFolderId: {
        driveId: itemInfo.driveId,
        folderId: itemInfo.parentFolderId,
        itemId: itemInfo.itemId,
      },
    });

    updateAssignmentTitle({
      driveIdFolderId: {
        driveId: itemInfo.driveId,
        folderId: itemInfo.parentFolderId,
      },
      itemId: itemInfo.itemId,
      payloadAssignment: payload,
    });
    const result = axios.post(`/api/handleBackAssignment.php`, payload)
    result.then((resp) => {
     if (resp.data.success) {
      addToast(`'${itemInfo.label}' back to '${itemInfo.assignment_title}'`, ToastType.SUCCESS);
    } else {
       onAssignmentError({errorMessage: resp.data.message});
     }
   })
   .catch((e) => {
     onAssignmentError({errorMessage: e.message});
   });

  };
  const [showAForm, setShowAForm] = useState(false);
  const role = useRecoilValue(roleAtom);
  // const [addToast, ToastType] = useToast();

  if (itemInfo?.isPublished === '0') {
    // // Publish content
    publishContentButton = (
      <>
        <Button
          value="Publish Content"
          switch_value="Published"
          callback={handlePublishContent}
        />
      </>
    );
  }


  // // View Assignment Form
  const checkIsVersionAssigned = () =>{
    
    const selectedVId  = useRecoilValue(selectedVersionAtom); 
    // console.log(">>>>>>>>>>>>>>>>>>>>selectedVersionId",selectedVId);
   const assignedArr = props.versionArr.filter((item)=>item.versionId === selectedVId);
  if(assignedArr.length > 0 && assignedArr[0].isAssigned == '1') {
    return true;
  }else{
    return false;
  }
    }

  if (itemInfo.isAssigned === '1' && checkIsVersionAssigned()) {
    assignmentForm = (
      <>
        {
          <>
            <div>
              <label>Assignment Name :</label>
              <input
                required
                type="text"
                name="assignment_title"
                value={aInfo ? aInfo?.assignment_title : ''}
                placeholder="Title goes here"
                onBlur={(e) => handleOnBlur(e)}
                onChange={handleChange}
              />
            </div>
            <div>                   
              <label>Assigned Date:</label>
              <input
                required
                type="text"
                name="assignedDate"
                value={aInfo ? aInfo?.assignedDate : ''}
                placeholder="0001-01-01 01:01:01 "
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Due date: </label>
              <input
                required
                type="text"
                name="dueDate"
                value={aInfo ? aInfo?.dueDate : ''}
                placeholder="0001-01-01 01:01:01"
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Time Limit:</label>
              <input
                required
                type="time"
                name="timeLimit"
                value={aInfo ? aInfo?.timeLimit : ''}
                placeholder="01:01:01"
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Number Of Attempts:</label>
              <input
                required
                type="number"
                name="numberOfAttemptsAllowed"
                value={aInfo ? aInfo?.numberOfAttemptsAllowed : ''}
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Attempt Aggregation :</label>
              <input
                required
                type="text"
                name="attemptAggregation"
                value={aInfo ? aInfo?.attemptAggregation : ''}
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Total Points Or Percent: </label>
              <input
                required
                type="number"
                name="totalPointsOrPercent"
                value={aInfo ? aInfo?.totalPointsOrPercent : ''}
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Grade Category: </label>
              <input
                required
                type="select"
                name="gradeCategory"
                value={aInfo ? aInfo?.gradeCategory : ''}
                onBlur={handleOnBlur}
                onChange={handleChange}
              />
            </div>
            <div>
              <label>Individualize: </label>
              <input
                required
                type="checkbox"
                name="individualize"
                checked={aInfo ? aInfo?.individualize : false}
                onChange={handleOnBlur}
              />
            </div>
            <div>
              <label>Multiple Attempts: </label>
              <input
                required
                type="checkbox"
                name="multipleAttempts"
                checked={aInfo ? aInfo?.multipleAttempts : false}
                onChange={handleOnBlur}
              />{' '}
            </div>
            <div>
              <label>Show solution: </label>
              <input
                required
                type="checkbox"
                name="showSolution"
                checked={aInfo ? aInfo?.showSolution : false}
                onChange={handleOnBlur}
              />{' '}
            </div>
            <div>
              <label>Show feedback: </label>
              <input
                required
                type="checkbox"
                name="showFeedback"
                checked={aInfo ? aInfo?.showFeedback : false}
                onChange={handleOnBlur}
              />
            </div>
            <div>
              <label>Show hints: </label>
              <input
                required
                type="checkbox"
                name="showHints"
                checked={aInfo ? aInfo?.showHints : false}
                onChange={handleOnBlur}
              />
            </div>
            <div>
              <label>Show correctness: </label>
              <input
                required
                type="checkbox"
                name="showCorrectness"
                checked={aInfo ? aInfo?.showCorrectness : false}
                onChange={handleOnBlur}
              />
            </div>
            <div>
              <label>Proctor make available: </label>
              <input
                required
                type="checkbox"
                name="proctorMakesAvailable"
                checked={aInfo ? aInfo?.proctorMakesAvailable : false}
                onChange={handleOnBlur}
              />
            </div>
            <br />
            <div>
              <Button
                value="Publish assignment"
                switch_value="publish changes"
                callback={() => {
                  const result = publishContentAssignment({
                    driveIditemIdbranchIdparentFolderId: {
                      driveId: itemInfo.driveId,
                      folderId: itemInfo.parentFolderId,
                      itemId: itemInfo.itemId,
                    },
                    branchId: itemInfo.branchId,
                    contentId: itemInfo.contentId
                      ? itemInfo.contentId
                      : itemInfo.branchId,
                  });
                  const payload = {
                    ...aInfo,
                    assignment_isPublished: '1',
                    branchId: itemInfo.branchId,
                  };
                  publishAssignment({
                    driveIdFolderId: {
                      driveId: itemInfo.driveId,
                      folderId: itemInfo.parentFolderId,
                    },
                    itemId: itemInfo.itemId,
                    payload: payload,
                  });

                  result.then((resp) => {
                    if (resp.data.success) {
                      addToast(`'${aInfo.assignment_title}' Published'`, ToastType.SUCCESS);
                    }
                    else{
                      onAssignmentError({errorMessage: resp.data.message});
                    }
                  })
                  .catch( e => {
                    onAssignmentError({errorMessage: e.message});
                  })
                }}
                type="submit"
              ></Button>
            </div>
          </>
        }
      </>
    );
  }
  // // Make Assignment Title update(Load back available assignment) 
  if (itemInfo.isAssigned === '0') {
    loadAssignmentButton = (
      <>
        <Button value="load Assignment" callback={loadBackAssignment} />
      </>
    );
  }
  //  Make Assignment to content
  if (itemInfo.isAssigned === '1') {
    assignmentToContentButton = (
      <>
        <br />
      </>
    );
  }

  return (
    <>
      {/* {makeAssignmentButton} */}
      <br />
      {publishContentButton}
      <br />
      {/* {viewDoenetMLButton} */}
       <br />
      {/* {loadAssignmentButton} */}
      <br />
      {assignmentToContentButton}
      <br />
      {assignmentForm}
      <br />
    </>
  );
};
const FolderInfoPanel = () => {
  return <h1>Folder Info</h1>;
};
const VersionHistoryInfoPanel = (props) => {
  // console.log(">>>VersionHistoryInfoPanel" ,props );
  const itemInfo = props.contentInfo;
  // console.log(">>>itemInfo after selection",itemInfo);
  const versionHistory = useRecoilValueLoadable(itemHistoryAtom(itemInfo.branchId))
  const selectedVersionId  = useRecoilValue(versionHistoryReleasedSelectedAtom); 
  const { openOverlay,activateMenuPanel } = useToolControlHelper();
  const {addContentAssignment,updateVersionHistory,updatePrevVersionHistory,changeSettings,saveSettings,assignmentToContent,loadAvailableAssignment, publishContentAssignment,onAssignmentError,} = useAssignment();
  const {makeAssignment,onmakeAssignmentError,publishAssignment,onPublishAssignmentError,publishContent,onPublishContentError, updateAssignmentTitle,onUpdateAssignmentTitleError,convertAssignmentToContent,onConvertAssignmentToContentError} = useAssignmentCallbacks();
  const [addToast, ToastType] = useToast();
 const [checkIsAssigned,setIsAssigned] = useState(false);
 const [selectVersion,setSelectVersion] = useState(false)
 
  const versionHistorySelected = useRecoilCallback(({snapshot,set})=> async (version)=>{
    set(versionHistoryReleasedSelectedAtom,version.versionId) 
    let loadableDoenetML = await snapshot.getPromise(fileByContentId(version.contentId));
    const doenetML = loadableDoenetML.data;
    set(viewerDoenetMLAtom,(was)=>{
      let newObj = {...was}
      newObj.doenetML = doenetML;
      newObj.updateNumber = was.updateNumber+1;
      return newObj});
  })
  
let aInfo = '';
  const assignmentInfoSettings = useRecoilValueLoadable(loadAssignmentSelector(itemInfo.branchId));
  if (assignmentInfoSettings?.state === 'hasValue') {
  aInfo = assignmentInfoSettings?.contents
  }

  if (versionHistory.state === "loading"){ return null;}
  if (versionHistory.state === "hasError"){ 
    console.error(versionHistory.contents)
    return null;}

    let assignVersions = [];
        let makeAssignmentforReleasedButton = null;
        let unAssignButton = null;
        let viewContentButton = null;
        let releasedVersions = [];
        let switchAssignmentButton = null;
    if(versionHistory.state === "hasValue"){
      for (let version of versionHistory.contents.named){
        // console.log(">>>version",version);
        let titleText = version.title;
        let versionStyle = {};
        if (selectVersion){
          versionStyle = {backgroundColor:"#b8d2ea"}
         
           makeAssignmentforReleasedButton = <>
         <Button
          value="Make Assignment"
          callback={async () => {
            // setShowAForm(true);
            setIsAssigned(true);
            const result = await addContentAssignment({
              driveIditemIdbranchIdparentFolderId: {
                driveId: itemInfo.driveId,
                folderId: itemInfo.parentFolderId,
                itemId: itemInfo.itemId,
              },
              branchId: itemInfo.branchId,
              contentId: selectedContentId(),
              versionId:selectedVId,
            });
            let payload = {
              ...aInfo,
              itemId: itemInfo.itemId,
              assignment_title: 'Untitled Assignment',
              isAssigned: '1',
              branchId: itemInfo.branchId,
              contentId: selectedContentId(),
              driveId:itemInfo.driveId,
              versionId:selectedVId
            };

            makeAssignment({
              driveIdFolderId: {
                driveId: itemInfo.driveId,
                folderId: itemInfo.parentFolderId,
              },
              itemId: itemInfo.itemId,
              payload: payload,
            });
            updateVersionHistory(
              itemInfo.branchId,
              selectedVId
            )
            try {
              if(result.success){
                addToast(`Add new assignment 'Untitled assignment'`, ToastType.SUCCESS,);
              }
              else{
                onAssignmentError({ errorMessage: result.message });
              }
              
            } catch (e) {
              onAssignmentError({ errorMessage: e});

            }
          }}
        />
        <br />
          </>
           unAssignButton = <>
           <Button
            value="Unassign"
            callback={async () => { 
             
              
              assignmentToContent({
                driveIditemIdbranchIdparentFolderId: {
                  driveId: itemInfo.driveId,
                  folderId: itemInfo.parentFolderId,
                  itemId: itemInfo.itemId,
                },
                branchId: itemInfo.branchId,
                contentId: version?.contentId,
                versionId:version?.versionId,
              });
             
              convertAssignmentToContent({
                driveIdFolderId: {
                  driveId: itemInfo.driveId,
                  folderId: itemInfo.parentFolderId,
                },
                itemId: itemInfo.itemId,
                branchId: itemInfo.branchId,
                contentId: version?.contentId,
                versionId:version?.versionId,
              });
          
              const result = axios.post(`/api/handleMakeContent.php`,{contentId: version?.contentId,versionId:version?.versionId,itemId: itemInfo.itemId,branchId:itemInfo.branchId })
              result.then((resp) => {
                if (resp.data.success) {
                  addToast(`'${itemInfo.assignment_title}' back to '${itemInfo.label}''`, ToastType.SUCCESS);
                } else {
                  onAssignmentError({errorMessage: resp.data.message});
                }
              })
              .catch((e) => {
                onAssignmentError({errorMessage: e.message});
              });
              
            }}
          />
          <br /><br />
            </>
           viewContentButton = (
            <>
              <Button
                value="View Version"
                callback={() => {
                  openOverlay({
                    type: 'content',
                    branchId: itemInfo?.branchId,
                    // contentId: itemInfo?.contentId,
                  });
                }}
              />
            </>
          );
          switchAssignmentButton= (
            <>
              <Button
          value="Switch Assignment"
          callback={async () => {
            // setShowAForm(true);
            setIsAssigned(true);
            const result = await addContentAssignment({
              driveIditemIdbranchIdparentFolderId: {
                driveId: itemInfo.driveId,
                folderId: itemInfo.parentFolderId,
                itemId: itemInfo.itemId,
              },
              branchId: itemInfo.branchId,
              contentId: selectedContentId(),
              versionId:selectedVId,
              // prevAssignedVersionId:prevAssignedVersionId(),
            });
            let payload = {
              // ...aInfo,
              itemId: itemInfo.itemId,
              assignment_title: 'Untitled Assignment',
              isAssigned: '1',
              branchId: itemInfo.branchId,
              contentId: selectedContentId(),
              driveId:itemInfo.driveId,
              versionId:selectedVId
            };

            makeAssignment({
              driveIdFolderId: {
                driveId: itemInfo.driveId,
                folderId: itemInfo.parentFolderId,
              },
              itemId: itemInfo.itemId,
              payload: payload,
            });
            updateVersionHistory(
              itemInfo.branchId,
              selectedVId
            )
            updatePrevVersionHistory(
              itemInfo.branchId,
              prevAssignedVersionId()
            )
            try {
              if(result.success){
                addToast(`Switch  assignment 'Untitled assignment'`, ToastType.SUCCESS,);
              }
              else{
                onAssignmentError({ errorMessage: result.message });
              }
              
            } catch (e) {
              onAssignmentError({ errorMessage: e});

            }
          }}
        />
            </>
          );

      }
  let assignedTitle = '';
  let assignedIcon = '';

  if(version.isReleased === '1'){
    assignedTitle = titleText
  }else if(version.isReleased === '1' && version?.isAssigned == '1' ){
    assignedTitle = `${assignedIcon} ${titleText}`
  }
         releasedVersions = (
          <React.Fragment key={`history${version.versionId}`}>
            <div
              onClick={() => {
                if (version.versionId !== selectedVersionId) {
                  versionHistorySelected(version);
                }
              }}
              style={versionStyle}
            >
              <div>{version.title}</div>
            </div>
            {/* {itemInfo.isAssigned !== '1'  && makeAssignmentforReleasedButton} */}
           {/* {itemInfo.isAssigned !== '1'  && viewContentButton} */}

           {/* {itemInfo.isAssigned == '1' && version?.isAssigned == '1' && unAssignButton} */}
          </React.Fragment>
        );
      //TODO do we need draft or only released or latest released
          if (version.isReleased === "1" ){ 
            assignVersions.push(releasedVersions)
          }
          
  
    }
    }

 const [selectedVId, setSelectedVId] = useState();
 const setSelectedVersionAtom = useSetRecoilState(selectedVersionAtom)

const selectedVersion = (item) =>{
  // console.log(">>selectedVersion event ",item, item.isAssigned);
  setSelectVersion(true)
  setSelectedVId(item);
  setSelectedVersionAtom(item)

}

const checkIfAssigned = (item) =>{
  const assignedArr =  versionHistory.contents.named.filter((item)=>item.versionId === selectedVId);
if(assignedArr.length > 0 && assignedArr[0].isAssigned == '1') {
  return true;
}else{
  return false;
}
}

const checkAssignArrItemAssigned = (item) =>{
  const assignedArr =  versionHistory.contents.named.filter((item)=>item.isAssigned == '1');
if(assignedArr.length > 0) {
  return true;
}else{
  return false;
}
} 
const prevAssignedVersionId = () =>{
  const assignedArr =  versionHistory.contents.named.filter((item)=>item.isAssigned == '1');
  if(assignedArr.length > 0) {
    return assignedArr[0].versionId;
  }else{
    return '';
  }
}
const selectedContentId = () =>{
  const assignedArr =  versionHistory.contents.named.filter((item)=>item.versionId === selectedVId);
  if(assignedArr.length > 0) {
    return assignedArr[0].contentId;
  }else{
    return '';
  }
}
  return (
    <>
      <select multiple onChange = {(event) => selectedVersion(event.target.value)}>
        {versionHistory.contents.named.map((item, i) => (
            <>
            {item.isReleased == 1 ?  <option key={i} value={item.versionId}>
            {item.isAssigned == 1 ? '*' : ''}{item.title}
          </option> : ""}

          </>
        ))}
      </select>

      <br />
      <br />
    {itemInfo.isAssigned !== '1' &&  makeAssignmentforReleasedButton}
    {/* {console.log("@@@@@@@@@@@@checkIfAssigned",checkIfAssigned())} */}
    {itemInfo.isAssigned == '1'  && checkIfAssigned() && unAssignButton}
    {itemInfo.isAssigned == '1'  && checkAssignArrItemAssigned() && !checkIfAssigned() &&  switchAssignmentButton}

        {/*   {itemInfo.isAssigned !== '1' && viewContentButton}

      {itemInfo.isAssigned == '1' &&
        version?.isAssigned == '1' &&
        unAssignButton} */}
    </>
  );
  };

const ItemInfoPanel = (props) => {
  let versionArr = [];
  const contentInfoLoad = useRecoilValueLoadable(selectedInformation);
   const versionHistory = useRecoilValueLoadable(itemHistoryAtom(contentInfoLoad?.contents?.itemInfo?.branchId))

    if (versionHistory.state === "loading"){ return null;}
    if (versionHistory.state === "hasError"){ 
      console.error(versionHistory.contents)
      return null;}
      if (versionHistory.state === "hasValue"){ 
        versionArr = versionHistory?.contents?.named;
       }
  if (contentInfoLoad.state === 'loading') {
    return null;
  }
  if (contentInfoLoad.state === 'hasError') {
    console.error(contentInfoLoad.contents);
    return null;
  }
  let contentInfo = contentInfoLoad?.contents?.itemInfo;

  if (contentInfoLoad.contents?.number > 1) {
    return (
      <>
        <h1>{contentInfoLoad.contents.number} Content Selected</h1>
      </>
    );
  } else if (contentInfoLoad.contents?.number === 1) {
    if (contentInfo?.itemType === 'DoenetML') {
      return (
        <DoenetMLInfoPanel
          key={`DoenetMLInfoPanel${contentInfo.itemId}`}
          contentInfo={contentInfo}
          props={props}
          versionArr={versionArr}
        />
      );
    } else if (contentInfo?.itemType === 'Folder') {
      return (
        <FolderInfoPanel
          key={`FolderInfoPanel${contentInfo.itemId}`}
          contentInfo={contentInfo}
        />
      );
    }
  }
  return null;
};
const VersionInfo = (props) => {
  const contentInfoLoad = useRecoilValueLoadable(selectedInformation);
  if (contentInfoLoad.state === 'loading') {
    return null;
  }
  if (contentInfoLoad.state === 'hasError') {
    console.error(contentInfoLoad.contents);
    return null;
  }
  let contentInfo = contentInfoLoad?.contents?.itemInfo;

  if (contentInfoLoad.contents?.number > 1) {
    return (
      <>
        <h1>{contentInfoLoad.contents.number} Content Selected</h1>
      </>
    );
  } else if (contentInfoLoad.contents?.number === 1) {
    if (contentInfo?.itemType === 'DoenetML') {
      return (
        <VersionHistoryInfoPanel
          key={`VersionHistoryInfoPanel${contentInfo.itemId}`}
          contentInfo={contentInfo}
          props={props}
        />
      );
    }
  }
  return null;
};

//Student view info panel

// <div>
//       {
//         itemInfo.assignment_isPublished ===
//           '1'(
//             <div>
//               <h1>{aInfo?.assignment_title}</h1>
//               <p>Due: {aInfo?.dueDate}</p>
//               <p>Time Limit: {aInfo?.timeLimit}</p>
//               <p>
//                 Number of Attempts Allowed: {aInfo?.numberOfAttemptsAllowed}
//               </p>
//               <p>Points: {aInfo?.totalPointsOrPercent}</p>
//             </div>,
//           )}
//     </div>