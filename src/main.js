import { $ } from './ui/dom.js';
import { LOGO_SRC } from './data/gallery.js';
import { initLightboxSwipe } from './ui/lightbox.js';
import { applyAdminOverrides } from './admin.js';
import { initContactWidget } from './contact-widget.js';
import { startRouter } from './router.js';

$('#brandLogo').src = LOGO_SRC;
initLightboxSwipe();
initContactWidget();
applyAdminOverrides();
startRouter();
