export const ComingSoonPage = ({ productName }: { productName: string }) => {
    return (
        <div className="flex flex-col items-center justify-center px-4 pt-16 text-center lg:px-8 lg:pt-24">
            <h1 className="text-display-sm font-semibold text-primary md:text-display-md">{productName}</h1>
            <p className="mt-4 text-lg text-tertiary">Coming soon</p>
        </div>
    );
};
