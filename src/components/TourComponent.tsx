import React, { useEffect, useState } from 'react';
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride';

interface TourComponentProps {
  run: boolean;
  setRun: (run: boolean) => void;
  userRole: string;
}

export default function TourComponent({ run, setRun, userRole }: TourComponentProps) {
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    let tourSteps: Step[] = [];

    if (userRole === 'customer') {
      tourSteps = [
        {
          target: 'body',
          content: 'Welcome to Local Shop Discovery! Let us show you around.',
          placement: 'center',
          disableBeacon: true,
        },
        {
          target: '.tour-customer-home',
          content: 'Click here to go to the Home page and select your area to browse categories.',
        },
        {
          target: '.tour-customer-shops',
          content: 'Click here to view all shops and filter them by features.',
        }
      ];
    } else if (userRole === 'shop_owner') {
      tourSteps = [
        {
          target: 'body',
          content: 'Welcome to your Shop Owner Dashboard! Let us show you around.',
          placement: 'center',
          disableBeacon: true,
        },
        {
          target: '.tour-owner-dashboard',
          content: 'Here you can get an overview of your shop.',
        },
        {
          target: '.tour-owner-profile',
          content: 'Update your shop details, address, and Google Maps location here.',
        },
        {
          target: '.tour-owner-gallery',
          content: 'Upload photos of your shop and products to attract more customers.',
        },
        {
          target: '.tour-owner-products',
          content: 'Manage your product catalog and price list here.',
        }
      ];
    } else if (userRole === 'admin') {
      tourSteps = [
        {
          target: 'body',
          content: 'Welcome to the Admin Dashboard!',
          placement: 'center',
          disableBeacon: true,
        },
        {
          target: '.tour-admin-dashboard',
          content: 'View overall statistics and pending shop approvals.',
        },
        {
          target: '.tour-admin-areas',
          content: 'Manage areas and their specific categories and filters.',
        },
        {
          target: '.tour-admin-shops',
          content: 'Manage all registered shops across the platform.',
        }
      ];
    }

    setSteps(tourSteps);
  }, [userRole]);

  useEffect(() => {
    // Check if it's the first login
    const hasSeenTour = localStorage.getItem(`tourCompleted_${userRole}`);
    if (!hasSeenTour) {
      setRun(true);
    }
  }, [userRole, setRun]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem(`tourCompleted_${userRole}`, 'true');
    }
  };

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={run}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={steps}
      styles={{
        options: {
          zIndex: 10000,
          primaryColor: '#4f46e5', // indigo-600
        },
      }}
    />
  );
}
