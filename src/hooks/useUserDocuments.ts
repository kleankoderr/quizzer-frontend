import { useQuery } from '@tanstack/react-query';
import { userDocumentService } from '../services';

export const useUserDocuments = () => {
  return useQuery({
    queryKey: ['userDocuments'],
    queryFn: () => userDocumentService.getUserDocuments(),
  });
};
