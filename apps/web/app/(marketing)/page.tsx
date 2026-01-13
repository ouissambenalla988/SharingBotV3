import Link from 'next/link';
import { LogIn, UserPlus } from 'lucide-react';
import { Button } from '@kit/ui/button';

import { withI18n } from '~/lib/i18n/with-i18n';
import pathsConfig from '~/config/paths.config';

function Home() {
  return (
    <div className={'flex min-h-[80vh] items-center justify-center'}>
      <div className={'container mx-auto px-4'}>
        <div className={'mx-auto max-w-2xl text-center'}>
          <h1 className={'mb-4 text-5xl font-bold tracking-tight'}>
            Bienvenue sur SharingBot
          </h1>
          <p className={'mb-12 text-xl text-muted-foreground'}>
            Votre assistant intelligent pour le chat et l'analyse de documents
          </p>
          
          <div className={'flex flex-col items-center justify-center gap-4 sm:flex-row'}>
            <Button asChild size="lg" className="min-w-[200px]">
              <Link href={pathsConfig.auth.signIn}>
                <LogIn className="mr-2 h-5 w-5" />
                Se connecter
              </Link>
            </Button>
            
            <Button asChild size="lg" variant="outline" className="min-w-[200px]">
              <Link href={pathsConfig.auth.signUp}>
                <UserPlus className="mr-2 h-5 w-5" />
                Créer un compte
              </Link>
            </Button>
          </div>
          
          <div className={'mt-12 text-sm text-muted-foreground'}>
            <p>Connectez-vous pour accéder à votre espace de chat intelligent</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default withI18n(Home);
