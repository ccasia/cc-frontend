import useSWR from 'swr';
import { useMemo } from 'react';

import { fetcher, endpoints } from 'src/utils/axios';

import { useAuthContext } from 'src/auth/hooks';

const useGetClientCredits = () => {
  const { user } = useAuthContext();

  // Fetch client company info
  const { data: companyData, isLoading: isLoadingCompany } = useSWR(
    user && user.role === 'client' ? endpoints.client.checkCompany : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateOnReconnect: true,
      revalidateIfStale: true,
    }
  );

  // Fetch company details with subscription info
  const { data: companyDetails, isLoading: isLoadingCompanyDetails } = useSWR(
    companyData?.company?.id ? `${endpoints.company.getCompany}/${companyData.company.id}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateOnMount: true,
      revalidateOnReconnect: true,
      revalidateIfStale: true,
    }
  );

  const memoizedValue = useMemo(() => {
    const isLoading = isLoadingCompany || isLoadingCompanyDetails;
    
    // If no company or company details data, return default values
    if (!companyData?.company || !companyDetails) {
      return {
        availableCredits: 0,
        totalCredits: 0,
        usedCredits: 0,
        remainingCredits: 0,
        company: null,
        subscription: null,
        isLoading,
        error: null,
      };
    }

    const {company} = companyData;
    
    // Find the company's active subscription
    const activeSubscription = companyDetails.subscriptions?.find(sub => 
      sub.status === 'ACTIVE'
    ) || companyDetails.subscriptions?.[0]; // Fallback to first subscription if no active one found

    if (!activeSubscription) {
      return {
        availableCredits: 0,
        totalCredits: 0,
        usedCredits: 0,
        remainingCredits: 0,
        company,
        subscription: null,
        isLoading,
        error: 'No active subscription found',
      };
    }

    const totalCredits = activeSubscription.totalCredits || 0;
    const usedCredits = activeSubscription.creditsUsed || 0;
    const remainingCredits = totalCredits - usedCredits;
    const availableCredits = Math.max(0, remainingCredits); // Ensure non-negative

    return {
      availableCredits,
      totalCredits,
      usedCredits,
      remainingCredits,
      company,
      subscription: activeSubscription,
      isLoading,
      error: null,
    };
  }, [companyData, companyDetails, isLoadingCompany, isLoadingCompanyDetails]);

  return memoizedValue;
};

export default useGetClientCredits;