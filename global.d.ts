declare global {
    namespace jest {
        interface Matchers {
            toBeValidGzip(received?: any): CustomMatcherResult;
            toHaveUngzipValue(received: any, value?: any): CustomMatcherResult;
        }

        /*interface Expect {
            toBeValidGzip(received: any): CustomMatcherResult;
            toHaveUngzipValue(received: any, value): CustomMatcherResult;
        }*/
    }
}
