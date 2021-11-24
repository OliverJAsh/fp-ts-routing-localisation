import { end, format, lit, parse, Route, str, type } from 'fp-ts-routing';
import * as A from 'fp-ts/lib/Array';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import * as t from 'io-ts';

type About = {};

enum SearchSubRoute {
    collections = 'collections',
    photos = 'photos',
    users = 'users',
}
type Search = { subRoute: SearchSubRoute; query: string };

type RouteData =
    | { _tag: 'NotFound' }
    | ({ _tag: 'About' } & About)
    | ({ _tag: 'Search' } & Search);

const notFound: RouteData = { _tag: 'NotFound' };

type SubRouteParamsBySubRoute = Record<SearchSubRoute, string>;

const getSearchRoute = (subRouteParamsBySubRoute: SubRouteParamsBySubRoute) => {
    const decodeSubRouteParam = (subRoute: string) =>
        pipe(
            Object.entries(subRouteParamsBySubRoute) as Array<
                [SearchSubRoute, string]
            >,
            A.findFirst(([, value]) => value === subRoute),
            O.getOrElse((): [SearchSubRoute, string] => {
                throw new Error('Invalid sub route, this should never happen.');
            }),
            ([key]) => key,
        );

    const SubRouteT = t.union([
        t.literal(subRouteParamsBySubRoute.collections),
        t.literal(subRouteParamsBySubRoute.photos),
        t.literal(subRouteParamsBySubRoute.users),
    ]);
    const match = lit('s')
        .then(type('subRoute', SubRouteT))
        .then(str('query'))
        .then(end);

    const parser = match.parser.map(
        ({ query, subRoute }): RouteData => ({
            _tag: 'Search',
            query,
            subRoute: decodeSubRouteParam(subRoute),
        }),
    );

    const formatter = match.formatter.contramap(
        ({ query, subRoute }: Search) => ({
            query,
            subRoute: subRouteParamsBySubRoute[subRoute],
        }),
    );

    return {
        parser,
        formatter,
    };
};

const searchRouteEs = getSearchRoute({
    collections: 'colecciones',
    photos: 'fotos',
    users: 'usuarias',
});

console.log(parse(searchRouteEs.parser, Route.parse('/s/fotos/dog'), notFound));
console.log(parse(searchRouteEs.parser, Route.parse('/s/oops/dog'), notFound));
console.log(
    format(searchRouteEs.formatter, {
        query: 'dog',
        subRoute: SearchSubRoute.photos,
    }),
);
