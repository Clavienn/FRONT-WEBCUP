import type { Locale } from "@/lib/i18n/types"

export type LegalDocumentKind = "legal" | "privacy"

export interface LegalDocumentSection {
  title: string
  paragraphs: string[]
}

export interface LegalDocumentContent {
  title: string
  version: string
  introduction: string
  draftNotice: string
  sections: LegalDocumentSection[]
}

export const LEGAL_DOCUMENTS: Record<Locale, Record<LegalDocumentKind, LegalDocumentContent>> = {
  fr: {
    legal: {
      title: "Mentions légales et conditions d’utilisation",
      version: "Version 1.0 · 4 octobre 2026",
      introduction:
        "Ce document présente l’éditeur, le fonctionnement et les règles d’utilisation de Terra Nova. Prenez le temps de le lire avant de créer un compte ou d’utiliser un service.",
      draftNotice:
        "Document de projet à valider avant toute mise en production : l’identité juridique complète de l’éditeur, l’adresse de publication, l’hébergeur et les coordonnées de contact légal doivent être confirmés par l’équipe responsable.",
      sections: [
        {
          title: "1. Éditeur et contact",
          paragraphs: [
            "Terra Nova est une plateforme numérique de démonstration conçue pour présenter des services municipaux, des informations locales et un espace d’échange avec les habitants. Le projet est présenté par l’équipe DevAtoandro dans le cadre du Hackathon Webcup 2026.",
            "Contact général : contact@terra-nova.world. Pour une question relative à vos données ou pour faire remonter une difficulté, utilisez également le bouton « Aide et support » disponible dans la plateforme. Les informations légales définitives de l’entité éditrice devront être ajoutées avant une exploitation publique du service.",
          ],
        },
        {
          title: "2. Objet et périmètre du service",
          paragraphs: [
            "La plateforme permet, selon les fonctionnalités effectivement disponibles, de consulter des services et annonces, créer et gérer un compte, transmettre des demandes, organiser des rendez-vous et contacter l’administration. Une fonctionnalité décrite dans une maquette peut être indisponible, expérimentale ou évoluer sans préavis.",
            "Terra Nova est un projet de plateforme et ne constitue pas, par son seul nom ou son interface, un service public officiel ni une représentation d’une collectivité réelle. Ne transmettez pas de données médicales, financières, de documents d’identité ou d’informations particulièrement sensibles dans les champs libres, sauf demande explicite d’un service habilité et via un canal sécurisé indiqué par celui-ci.",
          ],
        },
        {
          title: "3. Création et sécurité du compte",
          paragraphs: [
            "Vous devez fournir des informations exactes et maintenir à jour les coordonnées que vous choisissez de renseigner. Les identifiants sont personnels : ne partagez pas votre mot de passe et avertissez l’équipe via « Aide et support » si vous suspectez un accès non autorisé.",
            "Les rôles et permissions déterminent les écrans et opérations accessibles. Une personne disposant d’un rôle d’agent ou d’administrateur peut accéder aux informations nécessaires à ses missions. Toute consultation ou action administrative peut être journalisée à des fins de sécurité et de traçabilité.",
          ],
        },
        {
          title: "4. Règles d’utilisation",
          paragraphs: [
            "Vous vous engagez à utiliser la plateforme de manière licite, respectueuse et conforme à sa finalité. Il est interdit de perturber son fonctionnement, tenter d’accéder à un compte ou à des données sans autorisation, usurper l’identité d’une personne, transmettre volontairement un contenu illicite ou détourner les formulaires de leur objet.",
            "Les informations envoyées doivent être pertinentes et limitées à ce qui est nécessaire au traitement de votre demande. Les contenus injurieux, menaçants, discriminatoires, publicitaires ou contenant des données personnelles de tiers sans motif légitime peuvent être retirés ou transmis aux personnes chargées de la modération.",
          ],
        },
        {
          title: "5. Messages, demandes et preuve de transmission",
          paragraphs: [
            "Après l’envoi d’un message par « Aide et support », la plateforme affiche une confirmation et un numéro de référence lorsque le serveur a accepté l’enregistrement. Conservez cette référence : elle permet à l’équipe de retrouver plus facilement votre contribution.",
            "La confirmation prouve la réception technique du message par la plateforme; elle ne garantit pas qu’une demande a déjà été examinée, acceptée ou résolue. Si vous ne voyez pas de référence, considérez que l’envoi n’est pas confirmé et réessayez ou contactez contact@terra-nova.world.",
          ],
        },
        {
          title: "6. Disponibilité, liens et responsabilité",
          paragraphs: [
            "L’équipe s’efforce de maintenir un service compréhensible et disponible, mais ne garantit pas une disponibilité continue, l’absence d’erreur ou la conservation d’une maquette de démonstration. Des opérations de maintenance, incidents ou changements techniques peuvent interrompre certaines fonctions.",
            "Les liens vers des sites tiers sont fournis pour faciliter la navigation. Leur contenu, leur sécurité et leurs pratiques de données relèvent de leurs éditeurs respectifs. Vérifiez leurs propres conditions avant de leur transmettre des informations.",
          ],
        },
        {
          title: "7. Propriété intellectuelle et évolution",
          paragraphs: [
            "Les éléments de l’interface, textes, marques, illustrations et logiciels sont protégés par les règles applicables de propriété intellectuelle, sous réserve des droits de leurs auteurs et fournisseurs. Leur réutilisation au-delà des usages autorisés nécessite l’accord du titulaire concerné.",
            "Les présentes mentions peuvent évoluer pour refléter de nouvelles fonctionnalités, des changements d’organisation ou des obligations légales. La version et la date affichées en tête du document permettent d’identifier le texte consulté.",
          ],
        },
        {
          title: "8. Questions et signalements",
          paragraphs: [
            "Pour demander une précision, signaler un contenu ou expliquer une inquiétude concernant le fonctionnement du service, ouvrez « Aide et support », décrivez la situation sans inclure de secret ni de données inutiles, puis conservez le numéro de référence affiché après l’envoi.",
            "Si vous ne pouvez pas vous connecter, vous pouvez joindre contact@terra-nova.world. N’envoyez jamais votre mot de passe par message ou par e-mail.",
          ],
        },
      ],
    },
    privacy: {
      title: "Politique de confidentialité",
      version: "Version 1.0 · 4 octobre 2026",
      introduction:
        "Cette politique explique, en termes concrets, quelles informations Terra Nova utilise, pourquoi elles le sont, qui peut y accéder et comment poser une question ou faire une demande.",
      draftNotice:
        "Texte de transparence pour la version actuelle du projet. Avant une mise en production, l’équipe responsable doit confirmer le responsable de traitement, les bases légales, l’hébergeur, les destinataires, les durées de conservation et les coordonnées de l’autorité compétente.",
      sections: [
        {
          title: "1. Qui est responsable ?",
          paragraphs: [
            "Le projet identifie l’équipe éditrice Terra Nova (DevAtoandro, Webcup 2026) comme interlocuteur opérationnel pour les questions de confidentialité. L’identité juridique exacte du responsable de traitement et son adresse doivent être publiées par l’organisation qui exploitera le service avant son ouverture au public.",
            "Une question sur l’usage de vos informations, une demande d’accès ou une inquiétude peut être envoyée depuis le bouton « Aide et support ». Si vous n’avez pas de compte ou ne pouvez pas vous connecter, écrivez à contact@terra-nova.world sans joindre de mot de passe.",
          ],
        },
        {
          title: "2. Informations que vous fournissez",
          paragraphs: [
            "Lors de la création d’un compte, la plateforme traite votre adresse e-mail, votre prénom, votre nom et un mot de passe. Le mot de passe est transformé en empreinte cryptographique avant stockage; il n’est pas affiché dans votre profil et ne doit jamais être demandé par un agent.",
            "Vous pouvez ajouter un numéro de téléphone et une adresse à votre profil. Selon les fonctions utilisées, les messages envoyés à l’administration, les demandes citoyennes, les rendez-vous et les informations nécessaires à leur traitement peuvent aussi être associés à votre compte.",
            "Les champs libres sont destinés à décrire une demande de service ou une difficulté. N’y inscrivez pas de données sensibles ou celles d’une autre personne si elles ne sont pas nécessaires. Les informations que vous fournissez doivent être exactes et limitées à l’objectif du formulaire.",
          ],
        },
        {
          title: "3. Informations techniques et préférences",
          paragraphs: [
            "Pour assurer l’authentification et protéger les comptes, le système peut traiter des données techniques telles que l’adresse IP, la date d’une session et les informations du navigateur transmises lors de l’authentification. Certaines actions administratives et opérations sensibles sont inscrites dans un journal d’audit.",
            "Le choix de langue est enregistré dans le stockage local du navigateur afin de conserver votre préférence. La plateforme peut également utiliser des mécanismes techniques indispensables à la connexion et au fonctionnement des pages. Cette version n’a pas pour objectif de créer un profil publicitaire ni de vendre vos données.",
            "Les fournisseurs d’hébergement, d’API, de base de données ou de ressources web peuvent traiter les données strictement nécessaires à la fourniture technique du service. La liste exacte des prestataires dépendra de l’environnement de déploiement et devra être publiée par l’exploitant.",
          ],
        },
        {
          title: "4. Pourquoi ces informations sont-elles utilisées ?",
          paragraphs: [
            "Les coordonnées et identifiants servent à créer votre compte, vous authentifier, afficher le bon espace selon votre rôle, vous permettre de modifier votre profil et protéger l’accès à vos informations.",
            "Les données d’une demande ou d’un rendez-vous servent à transmettre le sujet au service concerné, suivre son traitement et vous répondre. Le contenu envoyé à « Aide et support » sert à examiner votre question ou votre inquiétude et à assurer le suivi de la réponse.",
            "Les journaux techniques et d’audit servent à détecter des erreurs, prévenir les usages abusifs, sécuriser les comptes et établir l’historique d’actions nécessaires à l’administration. Ils ne doivent pas être consultés pour une finalité étrangère à ces objectifs.",
          ],
        },
        {
          title: "5. Qui peut consulter les données ?",
          paragraphs: [
            "Vos informations de compte sont accessibles aux personnes et composants techniques nécessaires au fonctionnement de la plateforme. Les agents et administrateurs ne doivent consulter que les données utiles à leurs missions et selon les permissions qui leur sont attribuées.",
            "Un message de support peut être lu par l’équipe administrative chargée de répondre. Les prestataires techniques peuvent intervenir pour héberger ou maintenir le service, avec des accès encadrés par l’exploitant. Les données ne sont pas rendues publiques par le simple fait de créer un compte.",
            "Une transmission supplémentaire ne doit avoir lieu que si elle est nécessaire au service demandé, exigée par une règle applicable ou autorisée par vous. L’exploitant devra compléter cette section avec les destinataires et prestataires réellement utilisés.",
          ],
        },
        {
          title: "6. Conservation et sécurité",
          paragraphs: [
            "Les informations sont conservées pendant la durée nécessaire à la gestion du compte, au traitement de la demande, à la sécurité du service et au respect des obligations applicables. Aucun délai chiffré de conservation n’est configuré dans les informations présentées ici; l’exploitant doit publier un calendrier précis par catégorie avant la mise en production.",
            "Des mesures techniques et organisationnelles visent à protéger les données contre la perte, l’accès non autorisé, la modification ou la divulgation. Elles comprennent notamment le hachage des mots de passe, le contrôle des permissions, la protection des sessions et la journalisation de certaines opérations.",
            "Aucun système n’offre un risque nul. Si vous pensez qu’un compte ou une information est compromis, contactez rapidement l’administration via « Aide et support » et ne communiquez pas votre mot de passe.",
          ],
        },
        {
          title: "7. Vos choix et demandes",
          paragraphs: [
            "Vous pouvez consulter et corriger certaines informations depuis la page Profil. Vous pouvez également demander des précisions sur les données associées à votre compte, leur correction, leur suppression ou une limitation de leur utilisation en contactant l’administration.",
            "Les droits applicables et leurs modalités exactes dépendent de la législation du territoire où le service est exploité. L’équipe responsable devra indiquer l’autorité de contrôle compétente et les voies de recours avant la mise en production.",
            "Pour faciliter le suivi, décrivez le type de demande sans révéler de secret. Après l’envoi par « Aide et support », conservez la référence fournie : elle confirme que votre message a été enregistré par le serveur. La référence ne signifie pas que la demande est déjà résolue.",
          ],
        },
        {
          title: "8. Consentement et modifications",
          paragraphs: [
            "Lors de l’inscription, les cases d’acceptation indiquent les documents présentés et doivent être cochées pour poursuivre dans l’interface. La version actuelle ne renvoie pas encore un reçu de consentement distinct à l’API; l’exploitant doit mettre en place une preuve serveur horodatée et versionnée s’il en a besoin pour ses obligations.",
            "La politique peut être mise à jour si les fonctionnalités, les traitements ou les prestataires changent. En cas de changement important, l’exploitant doit informer les utilisateurs et recueillir un nouvel accord lorsque cela est requis. La version consultée est affichée en tête du document.",
          ],
        },
      ],
    },
  },
  en: {
    legal: {
      title: "Legal notice and terms of use",
      version: "Version 1.0 · October 4, 2026",
      introduction:
        "This document identifies the publisher, explains how Terra Nova works, and sets out the rules for using it. Please read it before creating an account or using a service.",
      draftNotice:
        "Project document to be approved before production: the publisher’s full legal identity, publication address, hosting provider, and official legal contact must be confirmed by the responsible team.",
      sections: [
        {
          title: "1. Publisher and contact",
          paragraphs: [
            "Terra Nova is a demonstration digital platform presenting municipal services, local information, and a way for residents to contact the administration. The project is presented by the DevAtoandro team as part of the 2026 Webcup Hackathon.",
            "General contact: contact@terra-nova.world. For questions about your data or to raise a concern, you can also use the platform’s “Help and support” button. The publisher’s final legal details must be added before the service is made publicly available.",
          ],
        },
        {
          title: "2. Purpose and scope",
          paragraphs: [
            "Depending on the features currently available, the platform lets you browse services and announcements, create and manage an account, submit requests, arrange appointments, and contact the administration. A feature shown in a mock-up may be unavailable, experimental, or changed without notice.",
            "Terra Nova is a platform project. Its name and interface do not, by themselves, make it an official public service or represent a real municipality. Do not submit medical, financial, identity-document, or other highly sensitive information in free-text fields unless an authorised service explicitly requests it through a secure channel.",
          ],
        },
        {
          title: "3. Accounts and security",
          paragraphs: [
            "You must provide accurate information and keep the contact details you choose to provide up to date. Your credentials are personal: do not share your password, and contact the team through “Help and support” if you suspect unauthorised access.",
            "Roles and permissions determine which screens and actions are available. Staff members and administrators may access information needed for their duties. Administrative access and sensitive actions may be logged for security and traceability.",
          ],
        },
        {
          title: "4. Acceptable use",
          paragraphs: [
            "You agree to use the platform lawfully, respectfully, and for its intended purposes. You must not disrupt its operation, try to access an account or data without permission, impersonate another person, knowingly submit unlawful content, or misuse forms.",
            "Submitted information should be relevant and limited to what is needed to handle your request. Abusive, threatening, discriminatory, promotional content or personal information about third parties without a legitimate reason may be removed or referred to the people responsible for moderation.",
          ],
        },
        {
          title: "5. Messages, requests, and proof of submission",
          paragraphs: [
            "After you send a message through “Help and support”, the platform displays a confirmation and reference number when the server has accepted the message. Keep that reference so the team can find your contribution more easily.",
            "The confirmation proves technical receipt by the platform; it does not mean your request has already been reviewed, accepted, or resolved. If no reference appears, assume the submission was not confirmed and try again or contact contact@terra-nova.world.",
          ],
        },
        {
          title: "6. Availability, links, and responsibility",
          paragraphs: [
            "The team aims to keep the service understandable and available but cannot guarantee uninterrupted availability, error-free operation, or continued access to a demonstration project. Maintenance, incidents, or technical changes may interrupt some features.",
            "Links to third-party websites are provided for convenience. Their content, security, and data practices are the responsibility of their publishers. Review their own terms before submitting information to them.",
          ],
        },
        {
          title: "7. Intellectual property and changes",
          paragraphs: [
            "The interface, text, branding, illustrations, and software are protected by applicable intellectual-property rules, subject to the rights of their authors and suppliers. Reuse beyond permitted use requires approval from the relevant rights holder.",
            "This notice may change to reflect new features, organisational changes, or legal requirements. The version and date shown at the top identify the document you are reading.",
          ],
        },
        {
          title: "8. Questions and concerns",
          paragraphs: [
            "To ask a question, report content, or explain a concern about the service, open “Help and support”, describe the situation without including secrets or unnecessary personal information, and keep the reference shown after submission.",
            "If you cannot sign in, contact contact@terra-nova.world. Never send your password by message or email.",
          ],
        },
      ],
    },
    privacy: {
      title: "Privacy policy",
      version: "Version 1.0 · October 4, 2026",
      introduction:
        "This policy explains in practical terms what information Terra Nova uses, why it is used, who may access it, and how to ask a question or make a request.",
      draftNotice:
        "Transparency text for the current project. Before production, the responsible team must confirm the data controller, legal grounds, hosting provider, recipients, retention periods, and competent supervisory authority.",
      sections: [
        {
          title: "1. Who is responsible?",
          paragraphs: [
            "The Terra Nova publishing team (DevAtoandro, Webcup 2026) is the operational contact for privacy questions about this project. The exact legal identity and address of the data controller must be published by the organisation operating the service before public launch.",
            "To ask how your information is used, request access, or raise a concern, use the “Help and support” button. If you do not have an account or cannot sign in, email contact@terra-nova.world without including a password.",
          ],
        },
        {
          title: "2. Information you provide",
          paragraphs: [
            "When you create an account, the platform processes your email address, first name, last name, and password. The password is cryptographically hashed before storage; it is not displayed in your profile and must never be requested by staff.",
            "You may add a phone number and address to your profile. Depending on the features you use, messages to the administration, resident requests, appointments, and information needed to handle them may also be associated with your account.",
            "Free-text fields are intended to describe a service request or an issue. Do not include sensitive information or another person’s data unless it is necessary. Information should be accurate and limited to the form’s purpose.",
          ],
        },
        {
          title: "3. Technical information and preferences",
          paragraphs: [
            "To authenticate users and protect accounts, the system may process technical information such as IP address, session date, and browser information sent during authentication. Certain administrative actions and sensitive operations are entered in an audit log.",
            "Your language choice is saved in your browser’s local storage so the platform can remember it. The platform may also use technical mechanisms required for sign-in and page operation. This version is not intended to create advertising profiles or sell personal data.",
            "Hosting, API, database, or web-resource providers may process information strictly needed to deliver the technical service. The exact provider list depends on deployment and must be published by the operator.",
          ],
        },
        {
          title: "4. Why is information used?",
          paragraphs: [
            "Account details and credentials are used to create your account, authenticate you, show the correct space for your role, let you update your profile, and protect access to your information.",
            "Request or appointment details are used to route the subject to the relevant service, track handling, and respond to you. A message sent through “Help and support” is used to review your question or concern and follow up on the response.",
            "Technical and audit logs help identify errors, prevent misuse, secure accounts, and establish the history of actions needed for administration. They must not be accessed for unrelated purposes.",
          ],
        },
        {
          title: "5. Who can access the data?",
          paragraphs: [
            "Your account information is available to the people and technical components needed to operate the platform. Staff and administrators should access only information relevant to their duties and permissions.",
            "A support message may be read by the administrative team responsible for responding. Technical providers may process data to host or maintain the service, with access controlled by the operator. Creating an account does not make your information public.",
            "Further disclosure should occur only when needed for the requested service, required by an applicable rule, or authorised by you. The operator must complete this section with the actual recipients and providers.",
          ],
        },
        {
          title: "6. Retention and security",
          paragraphs: [
            "Information is kept for as long as needed to manage an account, handle a request, secure the service, and meet applicable obligations. No exact retention periods are specified in the information available here; the operator must publish a precise schedule for each category before production.",
            "Technical and organisational measures aim to protect information against loss, unauthorised access, alteration, or disclosure. They include password hashing, permission checks, session protection, and logging of certain operations.",
            "No system can eliminate every risk. If you think an account or information has been compromised, contact the administration promptly through “Help and support” and do not share your password.",
          ],
        },
        {
          title: "7. Your choices and requests",
          paragraphs: [
            "You can view and correct some information from your Profile page. You may also ask the administration for details about information linked to your account, or request correction, deletion, or restricted use.",
            "The rights that apply and the exact process depend on the law in the territory where the service operates. Before production, the responsible operator must identify the competent supervisory authority and available complaint channels.",
            "To make follow-up easier, describe the type of request without revealing secrets. After sending through “Help and support”, keep the reference provided: it confirms that the server recorded your message. The reference does not mean your request is already resolved.",
          ],
        },
        {
          title: "8. Consent and changes",
          paragraphs: [
            "During registration, the consent checkboxes identify the documents presented and must be checked to continue in the interface. The current version does not yet send a separate consent receipt to the API; the operator should implement a timestamped, versioned server-side record if required for its obligations.",
            "This policy may be updated when features, processing, or providers change. For a significant change, the operator should inform users and obtain renewed agreement when required. The version being read is shown at the top of the document.",
          ],
        },
      ],
    },
  },
}