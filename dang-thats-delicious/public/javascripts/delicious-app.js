import "babel-polyfill";
import "../sass/style.scss";

import { $, $$ } from "./modules/bling";
import autocomplete from "./modules/autocomplete";
import typeAhead from "./modules/typeAhead";
import map from "./modules/map";
import Heart from "./modules/heart";

autocomplete($("#address"), $("#lat"), $("#lng"));
map($("#map"));
typeAhead($(".search"));
new Heart($$('[data-ref="HeartForm"]'));
