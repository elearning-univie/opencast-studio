//; -*- mode: rjsx;-*-
/** @jsx jsx */
import { jsx } from 'theme-ui';

import { faChalkboard, faChalkboardTeacher, faUser } from '@fortawesome/free-solid-svg-icons';
import { Container, Flex, Heading, Text } from '@theme-ui/components';
import { Styled } from 'theme-ui';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useDispatch, useRecordingState } from '../../../recording-context';

import Notification from '../../notification';

import { stopCapture, startUserCapture, startDisplayCapture } from '../capturer';
import { ActionButtons } from '../elements';
import { SourcePreview } from './preview';


export default function VideoSetup(props) {
  const { t } = useTranslation();

  const dispatch = useDispatch();
  const state = useRecordingState();
  const { displayStream, userStream, displaySupported, userSupported } = state;

  const hasStreams = displayStream || userStream;
  const anySupported = displaySupported || userSupported;
  const bothSupported = displaySupported && userSupported;

  const BOTH = 'both';
  const DISPLAY = 'display';
  const USER = 'user';
  const NONE = 'none';

  const [activeSource, setActiveSource] = useState(
    (displayStream && userStream && BOTH)
      || (displayStream && DISPLAY)
      || (userStream && USER)
      || NONE
  );

  const USER_CONSTRAINTS = {
    video: { height: { ideal: 1080 }, facingMode: 'user' },
    audio: false
  };

  const clickUser = async () => {
    await startUserCapture(dispatch, USER_CONSTRAINTS);
    setActiveSource(USER);
  };
  const clickDisplay = async () => {
    await startDisplayCapture(dispatch);
    setActiveSource(DISPLAY);
  };
  const clickBoth = async () => {
    await startUserCapture(dispatch, USER_CONSTRAINTS);
    setActiveSource(BOTH);
    await startDisplayCapture(dispatch);
  };

  const reselectSource = () => {
    stopCapture(state, dispatch);
    setActiveSource(NONE);
  };

  // The warnings if we are not allowed to capture a stream.
  const userWarning = (state.userAllowed === false) && (
    <Notification isDanger>
      <Heading as="h3" mb={2}>
        {t('source-user-not-allowed-title')}
      </Heading>
      <Text>{t('source-user-not-allowed-text')}</Text>
    </Notification>
  );
  const displayWarning = (state.displayAllowed === false) && (
    <Notification isDanger>
      <Heading as="h3" mb={2}>
        {t('source-display-not-allowed-title')}
      </Heading>
      <Text>{t('source-display-not-allowed-text')}</Text>
    </Notification>
  );

  // The body depends on which source is currently selected.
  let body;
  switch (activeSource) {
    case NONE:
      if (anySupported) {
        body = (
          <Flex
            sx={{
              flexDirection: ['column', 'row'],
              maxWidth: [270, 850],
              width: '100%',
              mx: ['auto', 'none'],
              mb: 3,
              flex: ['0 1 auto', '1 1 auto'],
              maxHeight: ['none', '270px'],
              minHeight: [0, ''],
              justifyContent: ['flex-start', 'center'],
              '& > :not(:last-of-type)': {
                mb: [3, 0],
                mr: [0, 3],
              },
            }}
          >
            { displaySupported && <OptionButton
              label={t('sources-scenario-display')}
              icon={faChalkboard}
              onClick={clickDisplay}
            />}
            { bothSupported && <OptionButton
              label={t('sources-scenario-display-and-user')}
              icon={faChalkboardTeacher}
              onClick={clickBoth}
            />}
            { userSupported && <OptionButton
              label={t('sources-scenario-user')}
              icon={faUser}
              onClick={clickUser}
            />}
          </Flex>
        );
      } else {
        body = <Notification isDanger>{t('sources-video-none-available')}</Notification>;
      }
      break;
    case USER:
      body = <SourcePreview
        title={t('source-user-title')}
        reselectSource={reselectSource}
        warnings={userWarning}
        streams={[state.userStream]}
      />;
      break;
    case DISPLAY:
      body = <SourcePreview
        title={t('source-display-title')}
        reselectSource={reselectSource}
        warnings={displayWarning}
        streams={[state.displayStream]}
      />;
      break;
    case BOTH:
      // body = <DisplayAndUserMedia onReselect={reselectSource} />;
      body = <SourcePreview
        title={t('source-display-and-user-title')}
        reselectSource={reselectSource}
        warnings={[displayWarning, userWarning]}
        streams={[state.displayStream, state.userStream]}
      />;
      break;
    default:
      return <p>Something went very wrong</p>;
  };


  return (
    <Container
      sx={{
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto',
        minHeight: 0,
      }}
    >
      <Styled.h1 sx={{ textAlign: 'center', fontSize: ['26px', '30px', '32px'] }}>
        {t('sources-video-question')}
      </Styled.h1>

      { body }

      <ActionButtons next={{ onClick: () => props.nextStep(), disabled: !hasStreams }} />
    </Container>
  );
}

const OptionButton = ({ icon, label, onClick }) => {
  return (
    <button
      onClick={onClick}
      sx={{
        fontFamily: 'inherit',
        color: 'gray.0',
        border: '2px solid black',
        borderRadius: '8px',
        flex: ['0 1 180px', '0 1 100%'],
        minWidth: '180px',
        maxWidth: '300px',
        minHeight: ['120px', '150px'],
        p: 2,
      }}
    >
      <div sx={{ display: 'block', textAlign: 'center', mb: 3 }}>
        <FontAwesomeIcon icon={icon} size="3x"/>
      </div>
      <div sx={{ fontSize: 4 }}>{label}</div>
    </button>
  );
};
