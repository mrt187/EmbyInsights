using System.Reflection;
using System.Runtime.Loader;

if (args.Length == 0)
{
    Console.Error.WriteLine("Usage: AssemblyInspector <assembly> [type-name-filter ...]");
    return 2;
}

var assemblyPath = Path.GetFullPath(args[0]);
var searchDirectory = Path.GetDirectoryName(assemblyPath)!;
AssemblyLoadContext.Default.Resolving += (_, name) =>
{
    var dependencyPath = Path.Combine(searchDirectory, $"{name.Name}.dll");
    return File.Exists(dependencyPath) ? AssemblyLoadContext.Default.LoadFromAssemblyPath(dependencyPath) : null;
};
var assembly = AssemblyLoadContext.Default.LoadFromAssemblyPath(assemblyPath);
var filters = args.Skip(1).ToArray();

Type[] types;
try
{
    types = assembly.GetTypes();
}
catch (ReflectionTypeLoadException exception)
{
    types = exception.Types.OfType<Type>().ToArray();
}

foreach (var type in types
    .Where(type => type.IsPublic && (filters.Length == 0 || filters.Any(filter =>
        filter.StartsWith('=')
            ? string.Equals(type.FullName, filter[1..], StringComparison.Ordinal)
            : (type.FullName ?? type.Name).Contains(filter, StringComparison.OrdinalIgnoreCase))))
    .OrderBy(type => type.FullName, StringComparer.Ordinal))
{
    Console.WriteLine($"TYPE {type.FullName}");
    foreach (var constructor in type.GetConstructors(BindingFlags.Public | BindingFlags.NonPublic | BindingFlags.Instance))
        Console.WriteLine($"  CTOR {constructor}");
    foreach (var @event in type.GetEvents())
        Console.WriteLine($"  EVENT {@event.EventHandlerType} {@event.Name}");
    foreach (var property in type.GetProperties())
        Console.WriteLine($"  PROPERTY {property.PropertyType} {property.Name}");
    foreach (var method in type.GetMethods(BindingFlags.Public | BindingFlags.Instance | BindingFlags.Static | BindingFlags.DeclaredOnly))
    {
        Console.WriteLine($"  METHOD {method}");
        foreach (var parameter in method.GetParameters())
            Console.WriteLine($"    PARAM {parameter.Name} optional={parameter.IsOptional} default={parameter.DefaultValue ?? "null"}");
    }
}

return 0;
